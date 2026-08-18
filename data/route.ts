import { densify, greatCircle, joinLines, lineLengthKm, type LngLat } from "@/lib/geo";
import { photos } from "./photos";
import {
  routedEnglishGarden,
  routedGardenHofbrauhaus,
  routedHbfWombat,
  routedMucHbf,
} from "./routed-paths";
import {
  routedBolzanoOrtisei,
  routedFassaBolzano,
  routedFirenzeSeceda,
  routedOrtiseiResciesa,
  routedOrtiseiValDiFassa,
  routedResciesaFirenze,
} from "./routed-dolomites";
import type { LocalRouteId, OvernightStop, PhotoPin, StopCluster } from "./types";

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

/** Valhalla street route from Bolzano station into Ortisei. */
export const busBolzanoOrtisei = routedBolzanoOrtisei;

/** Valhalla pedestrian route from Ortisei onto the Resciesa ridge. */
export const trailOrtiseiResciesa = routedOrtiseiResciesa;

/** Valhalla pedestrian route across the ridge to Rifugio Firenze. */
export const trailResciesaFirenze = routedResciesaFirenze;

export const MUNICH_HBF: LngLat = [11.5583, 48.1402];
export const INNSBRUCK_HBF: LngLat = [11.401, 47.2634];
export const BOLZANO: LngLat = [11.357, 46.498];
export const ORTISEI: LngLat = [11.6717, 46.5761];
export const RESCIESA: LngLat = [11.6825, 46.5986];
/** Rifugio Firenze / Regensburger Hütte, in Val Cisles. */
export const FIRENZE: LngLat = [11.7086, 46.6042];
/** Seceda summit ridge, ~2519 m. */
export const SECEDA: LngLat = [11.6893, 46.6106];
/** QC Terme Dolomiti, Pozza di Fassa — the spa, and the still-open Val di Fassa night. */
export const QC_TERME: LngLat = [11.6889, 46.4283];
/** Venezia Santa Lucia — the trail's real endpoint, not the lagoon centroid. */
export const VENICE: LngLat = [12.3208, 45.4413];
export const EISBACHWELLE: LngLat = [11.5877, 48.1435];
/** Wombat's City Hostel Munich Hauptbahnhof, Senefelderstraße 1. */
export const WOMBAT: LngLat = [11.5603286, 48.1389289];
export const MONTAGU: LngLat = [11.394, 47.267];
export const HOFBRAUHAUS: LngLat = [11.5799788, 48.1376334];
export const MONOPTEROS: LngLat = [11.5909208, 48.1498803];
export const CHINESE_TOWER: LngLat = [11.5920973, 48.1525525];
export const KLEINHESSELOHER_SEE: LngLat = [11.5961185, 48.1594065];

/** Valhalla pedestrian route through the Englischer Garten landmarks. */
export const walkEnglischerGarten = routedEnglishGarden;

/** Valhalla pedestrian route from the lake back into the old town. */
export const walkGardenHofbrauhaus = routedGardenHofbrauhaus;

/** Valhalla trail to the Seceda station, then the short viewpoint spur. */
export const trailFirenzeSeceda: LngLat[] = [
  ...routedFirenzeSeceda,
  [11.6893, 46.6106],
];

/**
 * Seceda down to Ortisei by gondola. The lift itself runs in two dead-straight
 * spans (summit station → Furnes mid-station → Ortisei) — no wiggle, unlike
 * the hiking legs. The short first hop covers the walk from the summit
 * viewpoint over to the lift's top station.
 */
export const gondolaSecedaOrtisei: LngLat[] = densify(
  [
    SECEDA,
    [11.6858, 46.6083], // summit station
    [11.679, 46.5905], // Furnes mid-station
    ORTISEI,
  ],
  0.2,
);

/** Ortisei over Passo Sella via Canazei to Val di Fassa, ending at QC Terme Dolomiti. */
export const busOrtiseiValDiFassa = routedOrtiseiValDiFassa;

/** Val di Fassa over Passo Costalunga to Bolzano — the way out. */
export const busFassaBolzano = routedFassaBolzano;

/** Bolzano → Venice by rail, the real routing via Verona. Long leg, coarser step. */
export const railBolzanoVenice: LngLat[] = densify(
  [
    BOLZANO,
    [11.2967, 46.3486], // Ora / Auer
    [11.1207, 46.0724], // Trento
    [11.0433, 45.8894], // Rovereto
    [10.9821, 45.4287], // Verona Porta Nuova
    [11.5387, 45.5447], // Vicenza
    [11.8802, 45.4166], // Padova
    [12.2384, 45.4824], // Venezia Mestre
    VENICE, // Venezia Santa Lucia
  ],
  4,
);

/** Valhalla street route used to stage the airport transfer into the city. */
export const railMucHbf = routedMucHbf;

/** Valhalla returns Hbf → Wombat; the beat consumes this line hostel → station. */
export const walkWombatHbf = [...routedHbfWombat].reverse();

export const localRoutes: Record<LocalRouteId, LngLat[]> = {
  "airport-transfer": railMucHbf,
  "hbf-wombat": routedHbfWombat,
  "wombat-hbf": walkWombatHbf,
  "english-garden": walkEnglischerGarten,
  "garden-hofbrauhaus": walkGardenHofbrauhaus,
};

export const flightOut = greatCircle(MCI, MUC, 96);
export const flightHome = greatCircle(VCE, MCI, 96);

/**
 * The named legs that make up the orange trail, in travel order. Ortisei and
 * Bolzano are each crossed twice (once heading in, once heading back out), so
 * position along the trail has to come from these boundaries rather than a
 * nearest-point search — see `legT` below.
 */
const TRAIL_LEGS = [
  { id: "munichInnsbruck", line: railMunichInnsbruck },
  { id: "innsbruckBolzano", line: railInnsbruckBolzano },
  { id: "bolzanoOrtisei", line: busBolzanoOrtisei },
  { id: "ortiseiResciesa", line: trailOrtiseiResciesa },
  { id: "resciesaFirenze", line: trailResciesaFirenze },
  { id: "firenzeSeceda", line: trailFirenzeSeceda },
  { id: "secedaOrtisei", line: gondolaSecedaOrtisei },
  { id: "ortiseiValDiFassa", line: busOrtiseiValDiFassa },
  { id: "fassaBolzano", line: busFassaBolzano },
  { id: "bolzanoVenice", line: railBolzanoVenice },
] as const;

type TrailLegId = (typeof TRAIL_LEGS)[number]["id"];

/** Continuous Europe line used for the orange trail, now reaching all the way to Venice. */
export const orangeTrail: LngLat[] = joinLines(TRAIL_LEGS.map((leg) => leg.line));

/** Exact 0..1 boundary of each leg along `orangeTrail`, from real leg lengths. */
export const legT: Record<TrailLegId, { start: number; end: number }> = (() => {
  const totalKm = TRAIL_LEGS.reduce((sum, leg) => sum + lineLengthKm(leg.line), 0);
  const out = {} as Record<TrailLegId, { start: number; end: number }>;
  let sinceStartKm = 0;
  for (const leg of TRAIL_LEGS) {
    const start = sinceStartKm / totalKm;
    sinceStartKm += lineLengthKm(leg.line);
    out[leg.id] = { start, end: sinceStartKm / totalKm };
  }
  return out;
})();

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
    days: [5, 8],
    clusterId: "dolomites",
  },
  {
    id: "ortisei",
    lngLat: ORTISEI,
    label: "Ortisei",
    kind: "town",
    destinationSlug: "ortisei",
    days: [5, 7],
    clusterId: "dolomites",
  },
  {
    id: "resciesa",
    lngLat: RESCIESA,
    label: "Rifugio Resciesa",
    kind: "hut",
    destinationSlug: "dolomites",
    detailSlug: "rifugio-resciesa",
    days: [5],
    clusterId: "dolomites",
  },
  {
    id: "firenze",
    lngLat: FIRENZE,
    label: "Rifugio Firenze",
    kind: "hut",
    destinationSlug: "dolomites",
    detailSlug: "rifugio-firenze",
    days: [6, 7],
    clusterId: "dolomites",
  },
  {
    id: "seceda",
    lngLat: SECEDA,
    label: "Seceda",
    kind: "station",
    destinationSlug: "dolomites",
    detailSlug: "seceda-summit",
    days: [7],
    clusterId: "dolomites",
  },
  {
    id: "val-di-fassa-tbd",
    lngLat: QC_TERME,
    label: "Val di Fassa",
    kind: "tbd",
    destinationSlug: "dolomites",
    detailSlug: "val-di-fassa-night",
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
    days: [8, 9],
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
    label: "Dolomites",
    lngLat: [11.7, 46.595],
    stopIds: ["bolzano", "ortisei", "resciesa", "firenze", "seceda", "val-di-fassa-tbd"],
    expandOnDays: [5, 6, 7, 8],
    anchor: "top",
  },
  {
    id: "venice",
    label: "Venice",
    lngLat: VENICE,
    stopIds: ["venice-tbd", "vce"],
    expandOnDays: [8, 9, 10],
    anchor: "left",
  },
];

/**
 * The "?" marker: the route itself is fully known now — descent, spa, and
 * the way out are all pinned down. What's still open is where in Val di
 * Fassa we actually sleep, so the marker sits at QC Terme, not on a line.
 */
export const unresolvedPoint: LngLat = QC_TERME;

/**
 * Photo pins for the map. `photo: null` marks a spot the map should still
 * show a pin for, without an image sourced yet. Keyed by day/cluster the
 * same way `overnightStops` is, so the map knows when to show and hide each.
 */
export const photoPins: PhotoPin[] = [
  {
    id: "eisbachwelle",
    lngLat: EISBACHWELLE,
    photo: photos.munich,
    caption: "Eisbachwelle, Munich",
    days: [3],
    clusterId: "munich",
  },
  {
    id: "monopteros",
    lngLat: MONOPTEROS,
    photo: photos.monopteros,
    caption: "Monopteros",
    days: [3],
    clusterId: "munich",
    focusId: "english-garden",
    offset: [-54, -8],
  },
  {
    id: "chinese-tower",
    lngLat: CHINESE_TOWER,
    photo: photos.chineseTower,
    caption: "Chinese Tower",
    days: [3],
    clusterId: "munich",
    focusId: "english-garden",
    offset: [52, 4],
  },
  {
    id: "kleinhesseloher-see",
    lngLat: KLEINHESSELOHER_SEE,
    photo: photos.kleinhesseloherSee,
    caption: "Kleinhesseloher See",
    days: [3],
    clusterId: "munich",
    focusId: "english-garden",
    offset: [0, -8],
  },
  {
    id: "hofbrauhaus",
    lngLat: HOFBRAUHAUS,
    photo: photos.hofbrauhaus,
    secondaryPhoto: photos.hofbrauhausInterior,
    caption: "Hofbräuhaus am Platzl",
    days: [3],
    clusterId: "munich",
    focusId: "hofbrauhaus",
  },
  {
    id: "innsbruck",
    lngLat: INNSBRUCK_HBF,
    photo: photos.innsbruck,
    caption: "Innsbruck",
    days: [4, 5],
    clusterId: "innsbruck",
  },
  {
    id: "ortisei",
    lngLat: ORTISEI,
    photo: photos.ortisei,
    caption: "Ortisei, Val Gardena",
    days: [5, 7],
    clusterId: "dolomites",
  },
  {
    id: "resciesa",
    lngLat: RESCIESA,
    photo: photos.resciesa,
    caption: "Rifugio Resciesa",
    days: [5],
    clusterId: "dolomites",
  },
  {
    id: "firenze",
    lngLat: FIRENZE,
    photo: photos.firenze,
    caption: "Rifugio Firenze",
    days: [6, 7],
    clusterId: "dolomites",
  },
  {
    id: "seceda",
    lngLat: SECEDA,
    photo: photos.dolomites,
    caption: "The Odle peaks from Seceda",
    days: [7],
    clusterId: "dolomites",
  },
  {
    id: "qc-terme",
    lngLat: QC_TERME,
    photo: null,
    caption: "QC Terme Dolomiti, Val di Fassa",
    days: [7],
    clusterId: "dolomites",
  },
  {
    id: "venice",
    lngLat: VENICE,
    photo: photos.venice,
    caption: "Venice",
    days: [8, 9],
    clusterId: "venice",
  },
];
