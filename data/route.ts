import { densify, greatCircle, type LngLat } from "@/lib/geo";
import type { OvernightStop, StopCluster } from "./types";

export const MCI: LngLat = [-94.7139, 39.2976];
export const MUC: LngLat = [11.7861, 48.3538];
export const VCE: LngLat = [12.3519, 45.5053];

export const railMunichInnsbruck: LngLat[] = densify(
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

export const railInnsbruckBolzano: LngLat[] = densify(
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

export const busBolzanoOrtisei: LngLat[] = densify(
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
export const trailOrtiseiResciesa: LngLat[] = densify(
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
export const trailResciesaFirenze: LngLat[] = densify(
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
export const trailFirenzePuez: LngLat[] = densify(
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

/** Honest dashed connector until the Day 8 exit is chosen. */
const towardVenice: LngLat[] = densify(
  [
    [11.8161, 46.59],
    [11.835, 46.548],
    [11.9, 46.42],
    [12.02, 46.18],
    [12.14, 45.88],
    [12.24, 45.58],
    [12.28, 45.46],
    [12.327, 45.437],
  ],
  10,
);

export const MUNICH_HBF: LngLat = [11.5583, 48.1402];
export const INNSBRUCK_HBF: LngLat = [11.401, 47.2634];
export const BOLZANO: LngLat = [11.357, 46.498];
export const ORTISEI: LngLat = [11.6717, 46.5761];
export const RESCIESA: LngLat = [11.6825, 46.5986];
export const FIRENZE: LngLat = [11.7672, 46.6117];
export const PUEZ: LngLat = [11.8161, 46.59];
export const VENICE: LngLat = [12.327, 45.437];
export const EISBACHWELLE: LngLat = [11.5877, 48.1435];
export const WOMBAT: LngLat = [11.555, 48.1405];
export const MONTAGU: LngLat = [11.394, 47.267];

export const railMucHbf: LngLat[] = densify(
  [MUC, [11.72, 48.29], [11.66, 48.22], [11.6, 48.17], MUNICH_HBF],
  1.4,
);

export const walkWombatHbf: LngLat[] = densify(
  [WOMBAT, [11.5568, 48.14035], MUNICH_HBF],
  0.04,
);

export const flightOut = greatCircle(MCI, MUC, 96);
export const flightHome = greatCircle(VCE, MCI, 96);

/** Continuous Europe line used for the orange trail, including the open exit. */
export const orangeTrail: LngLat[] = [
  ...railMunichInnsbruck,
  ...railInnsbruckBolzano.slice(1),
  ...busBolzanoOrtisei.slice(1),
  ...trailOrtiseiResciesa.slice(1),
  ...trailResciesaFirenze.slice(1),
  ...trailFirenzePuez.slice(1),
  ...towardVenice.slice(1),
];

export const overnightStops: OvernightStop[] = [
  {
    id: "mci",
    lngLat: MCI,
    label: "Kansas City",
    kind: "airport",
    days: [1, 10],
  },
  {
    id: "muc",
    lngLat: MUC,
    label: "Munich Airport",
    kind: "airport",
    days: [2],
    clusterId: "munich",
  },
  {
    id: "wombat",
    lngLat: WOMBAT,
    label: "Wombat Hostel",
    kind: "city",
    destinationSlug: "munich",
    detailSlug: "wombat-hostel",
    days: [2, 3],
    clusterId: "munich",
  },
  {
    id: "eisbachwelle",
    lngLat: EISBACHWELLE,
    label: "Eisbachwelle",
    kind: "town",
    destinationSlug: "munich",
    detailSlug: "eisbachwelle",
    days: [3],
    clusterId: "munich",
  },
  {
    id: "montagu",
    lngLat: MONTAGU,
    label: "Montagu Hostel",
    kind: "city",
    destinationSlug: "innsbruck",
    detailSlug: "montagu-hostel",
    days: [4],
    clusterId: "innsbruck",
  },
  {
    id: "bolzano",
    lngLat: BOLZANO,
    label: "Bolzano",
    kind: "station",
    days: [5],
    clusterId: "dolomites",
  },
  {
    id: "ortisei",
    lngLat: ORTISEI,
    label: "Ortisei",
    kind: "town",
    destinationSlug: "ortisei",
    days: [5],
    clusterId: "dolomites",
  },
  {
    id: "resciesa",
    lngLat: RESCIESA,
    label: "Rifugio Resciesa",
    kind: "hut",
    destinationSlug: "puez-odle",
    detailSlug: "rifugio-resciesa",
    days: [5],
    clusterId: "dolomites",
  },
  {
    id: "firenze",
    lngLat: FIRENZE,
    label: "Rifugio Firenze",
    kind: "hut",
    destinationSlug: "puez-odle",
    detailSlug: "rifugio-firenze",
    days: [6],
    clusterId: "dolomites",
  },
  {
    id: "puez",
    lngLat: PUEZ,
    label: "Rifugio Puez",
    kind: "hut",
    destinationSlug: "puez-odle",
    detailSlug: "rifugio-puez",
    days: [7],
    clusterId: "dolomites",
  },
  {
    id: "venice-tbd",
    lngLat: VENICE,
    label: "Venice",
    kind: "tbd",
    destinationSlug: "venice",
    detailSlug: "venice-lodging",
    days: [9],
    clusterId: "venice",
  },
  {
    id: "vce",
    lngLat: VCE,
    label: "Venice Airport",
    kind: "airport",
    days: [10],
    clusterId: "venice",
  },
];

export const stopClusters: StopCluster[] = [
  {
    id: "munich",
    label: "Munich",
    lngLat: [11.575, 48.137],
    stopIds: ["muc", "wombat", "eisbachwelle"],
    expandOnDays: [2, 3],
    anchor: "right",
  },
  {
    id: "innsbruck",
    label: "Innsbruck",
    lngLat: [11.404, 47.269],
    stopIds: ["montagu"],
    expandOnDays: [4],
    anchor: "left",
  },
  {
    id: "dolomites",
    label: "Puez-Odle",
    lngLat: [11.74, 46.608],
    stopIds: ["bolzano", "ortisei", "resciesa", "firenze", "puez"],
    expandOnDays: [5, 6, 7, 8],
    anchor: "top",
  },
  {
    id: "venice",
    label: "Venice",
    lngLat: [12.327, 45.437],
    stopIds: ["venice-tbd", "vce"],
    expandOnDays: [9, 10],
    anchor: "left",
  },
];

export const unresolvedPoint: LngLat = unresolvedExit[unresolvedExit.length - 1];
