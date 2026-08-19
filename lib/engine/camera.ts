import { along, clamp, lerp, lerpBearing, lerpLngLat, smoothstep } from "./geo";
import type { LngLat } from "./types";
import type { JourneyView } from "./types";

export type CameraPose = {
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
};

/** Builds a complete camera frame without knowing anything about a trip. */
export function pose(
  partial: Partial<JourneyView> &
    Pick<
      JourneyView,
      | "phase"
      | "center"
      | "zoom"
      | "pitch"
      | "bearing"
      | "showFlight"
      | "flightT"
      | "flightLeg"
      | "trailT"
      | "dayId"
      | "label"
    >,
): JourneyView {
  return {
    ...partial,
    expandedClusterIds: partial.expandedClusterIds ?? [],
    visitedClusterIds: partial.visitedClusterIds ?? [],
    here: partial.here ?? null,
    focusStopId: partial.focusStopId ?? null,
    localRouteId: partial.localRouteId ?? null,
    localRouteT: clamp(partial.localRouteT ?? 0),
  };
}

/** Parks the camera on a place and optionally leans toward a focus point. */
export function cityHold(
  camera: CameraPose,
  options: {
    dayId: number;
    label: string;
    trailT: number;
    here?: LngLat | null;
    focusStopId?: string | null;
    focus?: LngLat;
    amount?: number;
    expandedClusterIds?: readonly string[];
    visitedClusterIds?: readonly string[];
  },
): JourneyView {
  const amount = clamp(options.amount ?? 0);
  const center =
    options.focus && amount > 0
      ? lerpLngLat(camera.center, options.focus, amount * 0.32)
      : camera.center;
  return pose({
    phase: "day",
    center,
    zoom: camera.zoom + amount * 0.48,
    pitch: camera.pitch,
    bearing: camera.bearing,
    showFlight: false,
    flightT: 0,
    flightLeg: null,
    trailT: options.trailT,
    dayId: options.dayId,
    label: options.label,
    here: options.here ?? null,
    focusStopId: options.focusStopId ?? null,
    expandedClusterIds: options.expandedClusterIds,
    visitedClusterIds: options.visitedClusterIds,
  });
}

/**
 * How far into a beat-less day section the camera sits still before blending
 * toward the next day's opening view. 0.74 reads as "linger, then hand off
 * late" rather than a slow crossfade the whole way through.
 */
export const HOLD = 0.74;

/**
 * Eases between two views. Continuous fields interpolate; discrete ones
 * (label, marker state) switch at the midpoint so they change once rather than
 * flickering across the blend.
 */
export function mix(a: JourneyView, b: JourneyView, t: number): JourneyView {
  const u = smoothstep(t);
  const pick = u < 0.5 ? a : b;
  const flightMix = lerp(a.showFlight ? 1 : 0, b.showFlight ? 1 : 0, u);
  const showFlight = flightMix > 0.28;
  return {
    phase: showFlight ? "flight" : pick.phase,
    center: lerpLngLat(a.center, b.center, u),
    zoom: lerp(a.zoom, b.zoom, u),
    pitch: lerp(a.pitch, b.pitch, u),
    bearing: lerpBearing(a.bearing, b.bearing, u),
    showFlight,
    flightT: lerp(a.flightT, b.flightT, u),
    flightLeg: showFlight ? (a.flightLeg ?? b.flightLeg) : pick.flightLeg,
    trailT: lerp(a.trailT, b.trailT, u),
    dayId: pick.dayId,
    label: pick.label,
    expandedClusterIds: pick.expandedClusterIds,
    visitedClusterIds: pick.visitedClusterIds,
    here:
      a.here && b.here
        ? lerpLngLat(a.here, b.here, u)
        : u < 0.5
          ? a.here
          : b.here,
    focusStopId: pick.focusStopId,
    localRouteId: pick.localRouteId,
    localRouteT: lerp(a.localRouteT, b.localRouteT, u),
  };
}

export function holdThen(current: JourneyView, next: JourneyView, t: number) {
  if (t < HOLD) return current;
  return mix(current, next, (t - HOLD) / (1 - HOLD));
}

/**
 * Fraction of a travel beat spent departing, riding, and arriving.
 * DEPART: how quickly the camera pulls back from the origin city hold into
 * the travel framing — kept short so the pull-back reads as decisive, not
 * dawdling, on both a 1-stop hop and a multi-leg day.
 * ARRIVE: where the ride hands off to the destination hold. A slightly early
 * arrival gives long corridor shots enough room to visibly settle.
 */
const DEPART = 0.1;
const ARRIVE = 0.82;

/**
 * A moving hike shot should follow the hiker instead of watching the route
 * from across a region. Responsive correction preserves the ground area.
 */
const HIKE_FOLLOW_ZOOM = 15.7;

/**
 * Rides a real polyline: pull back from `from`, track the line while the trail
 * draws behind you, then settle into `arrive`.
 */
export function rideLine(
  from: JourneyView,
  travel: JourneyView,
  arrive: JourneyView,
  line: LngLat[],
  trailFrom: number,
  trailTo: number,
  t: number,
): JourneyView {
  if (t < DEPART) return mix(from, travel, t / DEPART);
  if (t < ARRIVE) {
    const u = smoothstep((t - DEPART) / (ARRIVE - DEPART));
    return {
      ...travel,
      here: along(line, u),
      trailT: lerp(trailFrom, trailTo, u),
    };
  }
  return mix(
    {
      ...travel,
      here: along(line, 1),
      trailT: trailTo,
    },
    arrive,
    (t - ARRIVE) / (1 - ARRIVE),
  );
}

/**
 * A close travel shot for walking legs. It keeps the authored pitch and
 * bearing, tightens broad travel cameras to a hiker-scale frame, and moves the
 * camera target with the hiker so the dot remains the subject.
 */
export function hikeLine(
  from: JourneyView,
  travel: JourneyView,
  arrive: JourneyView,
  line: LngLat[],
  trailFrom: number,
  trailTo: number,
  t: number,
): JourneyView {
  const origin = along(line, 0);
  const follow = {
    ...travel,
    zoom: Math.max(travel.zoom, HIKE_FOLLOW_ZOOM),
  };
  if (t < DEPART) {
    return mix(
      from,
      {
        ...follow,
        center: origin,
        here: origin,
        trailT: trailFrom,
      },
      t / DEPART,
    );
  }
  if (t < ARRIVE) {
    const u = smoothstep((t - DEPART) / (ARRIVE - DEPART));
    const here = along(line, u);
    return {
      ...follow,
      center: here,
      here,
      trailT: lerp(trailFrom, trailTo, u),
    };
  }
  const destination = along(line, 1);
  return mix(
    {
      ...follow,
      center: destination,
      here: destination,
      trailT: trailTo,
    },
    arrive,
    (t - ARRIVE) / (1 - ARRIVE),
  );
}
