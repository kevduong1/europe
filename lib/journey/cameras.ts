import {
  BOLZANO,
  FIRENZE,
  INNSBRUCK_HBF,
  MONTAGU,
  MUC,
  MUNICH_HBF,
  orangeTrail,
  ORTISEI,
  PUEZ,
  RESCIESA,
  VENICE,
  WOMBAT,
} from "@/data/route";
import { clamp, lerp, lerpLngLat, nearestT, smoothstep, type LngLat } from "@/lib/geo";
import { CLUSTERS, clusterState } from "./clusters";
import type { JourneyView } from "./types";

/** Where each named place falls along the continuous Europe trail, 0..1. */
export const T = {
  hbf: nearestT(orangeTrail, MUNICH_HBF),
  innsbruck: nearestT(orangeTrail, INNSBRUCK_HBF),
  montagu: nearestT(orangeTrail, MONTAGU),
  bolzano: nearestT(orangeTrail, BOLZANO),
  ortisei: nearestT(orangeTrail, ORTISEI),
  resciesa: nearestT(orangeTrail, RESCIESA),
  firenze: nearestT(orangeTrail, FIRENZE),
  puez: nearestT(orangeTrail, PUEZ),
  venice: nearestT(orangeTrail, VENICE),
};

type CityCam = {
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
};

export const CITY = {
  munich: {
    center: [11.575, 48.145] as LngLat,
    zoom: 11.38,
    pitch: 0,
    bearing: 0,
  },
  munichAirport: {
    center: [11.66, 48.24] as LngLat,
    zoom: 10.52,
    pitch: 0,
    bearing: 0,
  },
  innsbruck: {
    center: [11.404, 47.268] as LngLat,
    zoom: 12.02,
    pitch: 0,
    bearing: 0,
  },
  venice: {
    center: [12.335, 45.438] as LngLat,
    zoom: 12.22,
    pitch: 0,
    bearing: 0,
  },
  dolomites: {
    center: [11.74, 46.592] as LngLat,
    zoom: 12.02,
    pitch: 38,
    bearing: 16,
  },
  munichInnsbruck: {
    center: [11.82, 47.7] as LngLat,
    zoom: 7.82,
    pitch: 0,
    bearing: 6,
  },
  innsbruckBolzano: {
    center: [11.48, 46.88] as LngLat,
    zoom: 8.12,
    pitch: 0,
    bearing: 8,
  },
  bolzanoOrtisei: {
    center: [11.52, 46.54] as LngLat,
    zoom: 10.35,
    pitch: 8,
    bearing: 12,
  },
};

/** Builds a view, filling in marker state from the day unless a beat overrides it. */
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
  const clusters = clusterState(partial.dayId ?? null);
  const {
    expandedClusterIds,
    visitedClusterIds,
    here,
    focusStopId,
    ...rest
  } = partial;
  return {
    ...rest,
    expandedClusterIds: expandedClusterIds ?? clusters.expandedClusterIds,
    visitedClusterIds: visitedClusterIds ?? clusters.visitedClusterIds,
    here: here ?? null,
    focusStopId: focusStopId ?? null,
  };
}

/**
 * Parks the camera on a city. `amount` leans it toward `focus` and tightens the
 * zoom, which is how a beat draws attention to one stop without cutting away.
 */
export function cityHold(
  cam: CityCam,
  opts: {
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
  const amount = clamp(opts.amount ?? 0);
  const center =
    opts.focus && amount > 0
      ? lerpLngLat(cam.center, opts.focus, amount * 0.32)
      : cam.center;
  return pose({
    phase: "day",
    center,
    zoom: cam.zoom + amount * 0.48,
    pitch: cam.pitch,
    bearing: cam.bearing,
    showFlight: false,
    flightT: 0,
    flightLeg: null,
    trailT: opts.trailT,
    dayId: opts.dayId,
    label: opts.label,
    here: opts.here ?? null,
    focusStopId: opts.focusStopId ?? null,
    expandedClusterIds: opts.expandedClusterIds,
    visitedClusterIds: opts.visitedClusterIds,
  });
}

export const OVERVIEW: JourneyView = pose({
  phase: "overview",
  center: [11.72, 46.88],
  zoom: 6.35,
  pitch: 0,
  bearing: 0,
  showFlight: false,
  flightT: 0,
  flightLeg: null,
  trailT: 0,
  dayId: null,
  label: "The route",
  expandedClusterIds: CLUSTERS.none,
  visitedClusterIds: CLUSTERS.none,
});

const ATLANTIC_CENTER: LngLat = [-41.5, 52];
const ATLANTIC_ZOOM = 3.05;
const USA_CENTER: LngLat = [-97.2, 42];
const USA_ZOOM = 3.05;
const OCEAN_ZOOM = 2.15;

/** Keeps the plane visible at the very start of a leg. */
const MIN_FLIGHT_T = 0.006;

export function usaDepartView(): JourneyView {
  return pose({
    phase: "flight",
    center: USA_CENTER,
    zoom: USA_ZOOM,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT: MIN_FLIGHT_T,
    flightLeg: "out",
    trailT: 0,
    dayId: 1,
    label: "Kansas City → Munich",
    expandedClusterIds: CLUSTERS.none,
    visitedClusterIds: CLUSTERS.none,
  });
}

/** Hold over the plains, pull out over the ocean, then drop onto Munich. */
export function flightOutView(t: number): JourneyView {
  const u = clamp(t);
  let zoom: number;
  let center: LngLat;
  if (u < 0.1) {
    zoom = USA_ZOOM;
    center = USA_CENTER;
  } else if (u < 0.26) {
    const k = smoothstep((u - 0.1) / 0.16);
    zoom = lerp(USA_ZOOM, OCEAN_ZOOM, k);
    center = lerpLngLat(USA_CENTER, ATLANTIC_CENTER, k);
  } else if (u < 0.76) {
    zoom = OCEAN_ZOOM;
    center = ATLANTIC_CENTER;
  } else {
    const k = smoothstep((u - 0.76) / 0.24);
    zoom = lerp(OCEAN_ZOOM, CITY.munichAirport.zoom, k);
    center = lerpLngLat(ATLANTIC_CENTER, CITY.munichAirport.center, k);
  }
  const flightT =
    u < 0.76
      ? Math.max(MIN_FLIGHT_T, u)
      : lerp(0.76, 0.97, smoothstep((u - 0.76) / 0.24));
  return pose({
    phase: "flight",
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT,
    flightLeg: "out",
    trailT: 0,
    dayId: 1,
    label: "Kansas City → Munich",
    expandedClusterIds: CLUSTERS.none,
    visitedClusterIds: CLUSTERS.none,
  });
}

export function flightHomeView(t: number): JourneyView {
  const u = clamp(t);
  const zoom =
    u < 0.16
      ? lerp(CITY.venice.zoom, ATLANTIC_ZOOM, smoothstep(u / 0.16))
      : ATLANTIC_ZOOM;
  const center =
    u < 0.16
      ? lerpLngLat(CITY.venice.center, ATLANTIC_CENTER, smoothstep(u / 0.16))
      : ATLANTIC_CENTER;
  return pose({
    phase: "flight",
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT: Math.max(MIN_FLIGHT_T, u),
    flightLeg: "home",
    trailT: 1,
    dayId: 10,
    label: "Venice → Kansas City",
    expandedClusterIds: CLUSTERS.none,
    visitedClusterIds: CLUSTERS.everywhere,
  });
}

/** Touchdown: the plane lands halfway through, then the day takes over. */
export function mucArrival(t: number): JourneyView {
  const u = clamp(t);
  const onGround = u >= 0.48;
  const touchdown = smoothstep(Math.min(1, u / 0.48));
  return pose({
    phase: onGround ? "day" : "flight",
    center: CITY.munichAirport.center,
    zoom: CITY.munichAirport.zoom + u * 0.38,
    pitch: 0,
    bearing: 0,
    showFlight: !onGround,
    flightT: lerp(0.97, 1, touchdown),
    flightLeg: "out",
    trailT: 0,
    dayId: 2,
    label: "Arrive Munich",
    here: MUC,
    focusStopId: "muc",
    expandedClusterIds: CLUSTERS.munich,
    visitedClusterIds: CLUSTERS.none,
  });
}

export function munichStay(
  dayId: number,
  label: string,
  extra?: { here?: LngLat; focusStopId?: string; amount?: number; focus?: LngLat },
): JourneyView {
  return cityHold(CITY.munich, {
    dayId,
    label,
    trailT: 0,
    here: extra?.here ?? WOMBAT,
    focusStopId: extra?.focusStopId ?? "wombat",
    focus: extra?.focus ?? extra?.here,
    amount: extra?.amount ?? 0,
    expandedClusterIds: CLUSTERS.munich,
    visitedClusterIds: CLUSTERS.none,
  });
}