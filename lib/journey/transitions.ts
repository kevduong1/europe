import { along, lerp, lerpBearing, lerpLngLat, smoothstep, type LngLat } from "@/lib/geo";
import type { JourneyView } from "./types";

/** How far into a beat the camera sits still before easing toward the next one. */
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
  };
}

export function holdThen(current: JourneyView, next: JourneyView, t: number) {
  if (t < HOLD) return current;
  return mix(current, next, (t - HOLD) / (1 - HOLD));
}

/** Fraction of a travel beat spent departing, riding, and arriving. */
const DEPART = 0.1;
const ARRIVE = 0.86;

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
