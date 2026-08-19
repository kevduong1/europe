import { clamp, lerp, lerpLngLat, smoothstep, type LngLat } from "@/lib/engine/geo";
import type { JourneyView } from "@/lib/engine/types";
import { MUC } from "./geometry/legs";
import { CITY, pose } from "./cameras";
import { CLUSTERS } from "./clusters";

const ATLANTIC_CENTER: LngLat = [-41.5, 52];
const ATLANTIC_ZOOM = 3.05;
const USA_CENTER: LngLat = [-97.2, 42];
const USA_ZOOM = 3.05;
const OCEAN_ZOOM = 2.15;
const MIN_FLIGHT_T = 0.006;
const PULL_OUT_START = 0.1;
const PULL_OUT_END = 0.26;
const PULL_OUT_SPAN = PULL_OUT_END - PULL_OUT_START;
const DESCENT_START = 0.64;
const DESCENT_END = 0.86;
const DESCENT_SPAN = DESCENT_END - DESCENT_START;
const MUC_APPROACH_START = 0.9994;

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

export function flightOutView(progress: number): JourneyView {
  const u = clamp(progress);
  let zoom: number;
  let center: LngLat;
  if (u < PULL_OUT_START) {
    zoom = USA_ZOOM;
    center = USA_CENTER;
  } else if (u < PULL_OUT_END) {
    const phase = smoothstep((u - PULL_OUT_START) / PULL_OUT_SPAN);
    zoom = lerp(USA_ZOOM, OCEAN_ZOOM, phase);
    center = lerpLngLat(USA_CENTER, ATLANTIC_CENTER, phase);
  } else if (u < DESCENT_START) {
    zoom = OCEAN_ZOOM;
    center = ATLANTIC_CENTER;
  } else {
    const phase = smoothstep(clamp((u - DESCENT_START) / DESCENT_SPAN));
    zoom = lerp(OCEAN_ZOOM, CITY.munichAirport.zoom, phase);
    center = lerpLngLat(ATLANTIC_CENTER, CITY.munichAirport.center, phase);
  }
  const flightT =
    u < DESCENT_START
      ? Math.max(MIN_FLIGHT_T, u)
      : lerp(
          DESCENT_START,
          MUC_APPROACH_START,
          smoothstep(clamp((u - DESCENT_START) / DESCENT_SPAN)),
        );
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

export function flightHomeView(progress: number): JourneyView {
  const u = clamp(progress);
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

export function mucArrival(progress: number): JourneyView {
  const u = clamp(progress);
  const onGround = u >= 0.74;
  const touchdown = smoothstep(Math.min(1, u / 0.66));
  return pose({
    phase: onGround ? "day" : "flight",
    center: CITY.munichAirport.center,
    zoom: CITY.munichAirport.zoom + u * 0.34,
    pitch: CITY.munichAirport.pitch,
    bearing: CITY.munichAirport.bearing,
    showFlight: !onGround,
    flightT: lerp(MUC_APPROACH_START, 1, touchdown),
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
