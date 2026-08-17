import { densify, greatCircle, type LngLat } from "@/lib/geo";
import type { OvernightStop, PlaceLabel, RouteSegment } from "./types";

export const MCI: LngLat = [-94.7139, 39.2976];
export const MUC: LngLat = [11.7861, 48.3538];
export const VCE: LngLat = [12.3519, 45.5053];

const railMunichInnsbruck: LngLat[] = densify(
  [
    [11.5583, 48.1402],
    [11.68, 48.08],
    [11.83, 47.98],
    [12.02, 47.9],
    [12.119, 47.856],
    [12.16, 47.72],
    [12.162, 47.583],
    [12.066, 47.487],
    [11.9, 47.42],
    [11.778, 47.388],
    [11.6, 47.32],
    [11.401, 47.2634],
  ],
  3,
);

const railInnsbruckBolzano: LngLat[] = densify(
  [
    [11.401, 47.2634],
    [11.4, 47.2],
    [11.466, 47.091],
    [11.504, 47.003],
    [11.433, 46.893],
    [11.5, 46.84],
    [11.612, 46.79],
    [11.656, 46.715],
    [11.566, 46.64],
    [11.45, 46.56],
    [11.357, 46.498],
  ],
  2.5,
);

const busBolzanoOrtisei: LngLat[] = densify(
  [
    [11.357, 46.498],
    [11.42, 46.52],
    [11.531, 46.557],
    [11.6, 46.565],
    [11.6717, 46.5761],
  ],
  1.2,
);

/** Cable / climb from Ortisei onto the Resciesa ridge. */
const trailOrtiseiResciesa: LngLat[] = densify(
  [
    [11.6717, 46.5761],
    [11.674, 46.582],
    [11.677, 46.588],
    [11.68, 46.593],
    [11.6825, 46.5986],
  ],
  0.35,
);

/**
 * Approximate Resciesa → Firenze via the Seceda ridge and the Adolf-Munkel
 * path under the Odle spires. Plausible ridgeline geometry, not a GPX trace.
 */
const trailResciesaFirenze: LngLat[] = densify(
  [
    [11.6825, 46.5986],
    [11.692, 46.5994],
    [11.704, 46.6],
    [11.716, 46.5992],
    [11.728, 46.5984],
    [11.737, 46.5988],
    [11.744, 46.6015],
    [11.75, 46.606],
    [11.754, 46.6105],
    [11.758, 46.6142],
    [11.762, 46.6178],
    [11.765, 46.6165],
    [11.7665, 46.614],
    [11.7672, 46.6117],
  ],
  0.28,
);

/** Firenze → Puez over Forcella Poma onto the Puez plateau. */
const trailFirenzePuez: LngLat[] = densify(
  [
    [11.7672, 46.6117],
    [11.772, 46.608],
    [11.778, 46.604],
    [11.785, 46.6],
    [11.792, 46.5965],
    [11.798, 46.5938],
    [11.805, 46.5918],
    [11.81, 46.5908],
    [11.8161, 46.59],
  ],
  0.28,
);

/** Honest unresolved descent — fades out toward Vallunga / Selva. */
const unresolvedExit: LngLat[] = densify(
  [
    [11.8161, 46.59],
    [11.82, 46.584],
    [11.824, 46.576],
    [11.828, 46.568],
    [11.832, 46.558],
    [11.835, 46.548],
  ],
  0.4,
);

const waterToVenice: LngLat[] = densify(
  [
    [12.238, 45.482],
    [12.28, 45.46],
    [12.315, 45.445],
    [12.327, 45.437],
  ],
  1,
);

export const flightOut = greatCircle(MCI, MUC, 96);
export const flightHome = greatCircle(VCE, MCI, 96);

export const routeSegments: RouteSegment[] = [
  {
    id: "flight-out",
    mode: "flight",
    days: [1],
    coordinates: flightOut,
    label: "MCI → MUC",
  },
  {
    id: "rail-munich-innsbruck",
    mode: "rail",
    days: [4],
    coordinates: railMunichInnsbruck,
    label: "Munich → Innsbruck",
  },
  {
    id: "rail-innsbruck-bolzano",
    mode: "rail",
    days: [5],
    coordinates: railInnsbruckBolzano,
    label: "Innsbruck → Bolzano",
  },
  {
    id: "bus-bolzano-ortisei",
    mode: "bus",
    days: [5],
    coordinates: busBolzanoOrtisei,
    label: "Bolzano → Ortisei",
  },
  {
    id: "trail-ortisei-resciesa",
    mode: "trail",
    days: [5],
    coordinates: trailOrtiseiResciesa,
  },
  {
    id: "trail-resciesa-firenze",
    mode: "trail",
    days: [6],
    coordinates: trailResciesaFirenze,
  },
  {
    id: "trail-firenze-puez",
    mode: "trail",
    days: [7],
    coordinates: trailFirenzePuez,
  },
  {
    id: "unresolved-exit",
    mode: "unresolved",
    days: [8],
    coordinates: unresolvedExit,
    label: "route to be decided",
  },
  {
    id: "water-venice",
    mode: "water",
    days: [9, 10],
    coordinates: waterToVenice,
  },
  {
    id: "flight-home",
    mode: "flight",
    days: [10],
    coordinates: flightHome,
    label: "VCE → MCI",
  },
];

export const groundLine: LngLat[] = [
  ...railMunichInnsbruck,
  ...railInnsbruckBolzano.slice(1),
  ...busBolzanoOrtisei.slice(1),
  ...trailOrtiseiResciesa.slice(1),
  ...trailResciesaFirenze.slice(1),
  ...trailFirenzePuez.slice(1),
  ...unresolvedExit.slice(1),
];

export const overnightStops: OvernightStop[] = [
  {
    id: "wombat",
    lngLat: [11.555, 48.1405],
    label: "Wombat Hostel",
    kind: "city",
    destinationSlug: "munich",
    detailSlug: "wombat-hostel",
    days: [2, 3],
  },
  {
    id: "montagu",
    lngLat: [11.394, 47.267],
    label: "Montagu Hostel",
    kind: "city",
    destinationSlug: "innsbruck",
    detailSlug: "montagu-hostel",
    days: [4],
  },
  {
    id: "resciesa",
    lngLat: [11.6825, 46.5986],
    label: "Rifugio Resciesa",
    kind: "hut",
    destinationSlug: "puez-odle",
    detailSlug: "rifugio-resciesa",
    days: [5],
  },
  {
    id: "firenze",
    lngLat: [11.7672, 46.6117],
    label: "Rifugio Firenze",
    kind: "hut",
    destinationSlug: "puez-odle",
    detailSlug: "rifugio-firenze",
    days: [6],
  },
  {
    id: "puez",
    lngLat: [11.8161, 46.59],
    label: "Rifugio Puez",
    kind: "hut",
    destinationSlug: "puez-odle",
    detailSlug: "rifugio-puez",
    days: [7],
  },
  {
    id: "venice-tbd",
    lngLat: [12.327, 45.437],
    label: "Venice",
    kind: "tbd",
    destinationSlug: "venice",
    detailSlug: "venice-lodging",
    days: [9],
  },
];

export const placeLabels: PlaceLabel[] = [
  {
    id: "munich",
    lngLat: [11.575, 48.137],
    label: "Munich",
    destinationSlug: "munich",
    anchor: "right",
  },
  {
    id: "innsbruck",
    lngLat: [11.404, 47.269],
    label: "Innsbruck",
    destinationSlug: "innsbruck",
    anchor: "left",
  },
  {
    id: "ortisei",
    lngLat: [11.672, 46.576],
    label: "Ortisei",
    destinationSlug: "ortisei",
    anchor: "left",
  },
  {
    id: "puez-odle",
    lngLat: [11.74, 46.608],
    label: "Puez-Odle",
    destinationSlug: "puez-odle",
    anchor: "top",
  },
  {
    id: "venice",
    lngLat: [12.327, 45.437],
    label: "Venice",
    destinationSlug: "venice",
    anchor: "left",
  },
];

export const unresolvedPoint: LngLat = unresolvedExit[unresolvedExit.length - 1];

export function segmentsForDay(dayId: number | null) {
  if (dayId == null) {
    return routeSegments.filter((segment) => segment.mode !== "flight");
  }
  return routeSegments.filter((segment) => {
    if (segment.mode === "flight") return segment.days.includes(dayId);
    return true;
  });
}
