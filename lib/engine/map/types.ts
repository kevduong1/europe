import type { LngLat, OvernightStop, PhotoPin, StopCluster } from "../types";

export type MapMarkerRules = {
  outboundOriginStopId: string;
  outboundArrivalStopId: string;
  unresolvedDays: readonly number[];
  photoFocusOverrides: Readonly<Record<string, string>>;
};

export type TripMapData = {
  trail: LngLat[];
  flightOut: LngLat[];
  flightHome: LngLat[];
  localRoutes: Readonly<Record<string, LngLat[]>>;
  overnightStops: readonly OvernightStop[];
  stopClusters: readonly StopCluster[];
  photoPins: readonly PhotoPin[];
  unresolvedPoint: LngLat;
  markerRules: MapMarkerRules;
  terrain: { clusterIds: readonly string[]; minZoom: number };
};
