import type { LocalRouteId } from "@/data/types";
import type { LngLat } from "@/lib/geo";

export type JourneyPhase = "overview" | "flight" | "day";
export type FlightLeg = "out" | "home" | null;

/**
 * A single frame of the journey: where the camera sits, how far the trail and
 * flight have drawn, and which markers should be showing. Produced purely from
 * scroll position, then handed to the map to render imperatively.
 */
export type JourneyView = {
  phase: JourneyPhase;
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
  showFlight: boolean;
  flightT: number;
  flightLeg: FlightLeg;
  trailT: number;
  dayId: number | null;
  label: string;
  expandedClusterIds: readonly string[];
  visitedClusterIds: readonly string[];
  here: LngLat | null;
  focusStopId: string | null;
  /** A short, scene-specific Valhalla route, separate from the trip-wide trail. */
  localRouteId: LocalRouteId | null;
  localRouteT: number;
};
