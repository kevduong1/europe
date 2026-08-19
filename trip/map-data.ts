import type { TripMapData } from "@/lib/engine/map/types";
import { flightHome, flightOut } from "./geometry/flights";
import { localRoutes } from "./geometry/local-routes";
import { orangeTrail } from "./geometry/legs";
import { overnightStops, photoPins, unresolvedPoint } from "./markers";
import { stopClusters } from "./clusters";

export const tripMapData: TripMapData = {
  trail: orangeTrail,
  flightOut,
  flightHome,
  localRoutes,
  overnightStops,
  stopClusters,
  photoPins,
  unresolvedPoint,
  markerRules: {
    outboundOriginStopId: "mci",
    outboundArrivalStopId: "muc",
    unresolvedDays: [7],
    photoFocusOverrides: {
      "qc-terme": "val-di-fassa-tbd",
      venice: "venice-tbd",
      innsbruck: "montagu",
    },
  },
  terrain: { clusterIds: ["dolomites"], minZoom: 8.5 },
};
