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
  routedOrtiseiValDiFassa,
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

/**
 * Ortisei to Rifugio Resciesa: the Raschötz funicular followed by trail 35
 * west from the mountain station to the hut. The transport line is kept here
 * as one continuous leg because it is presented as a single itinerary beat.
 */
export const trailOrtiseiResciesa: LngLat[] = densify(
  [
    [11.6717, 46.5761],
    [11.6750721, 46.5764208], // Resciesa funicular valley station
    [11.6724666, 46.578776],
    [11.6734076, 46.5813682],
    [11.6746041, 46.5846646],
    [11.6756556, 46.5875295],
    [11.6768344, 46.5908062],
    [11.6779694, 46.5939458],
    [11.6793391, 46.5977782], // Resciesa funicular mountain station
    [11.679857, 46.597965],
    [11.677797, 46.596974],
    [11.67311, 46.59618],
    [11.669858, 46.597745],
    [11.666793, 46.598491],
    [11.66195, 46.600317],
    [11.6621496, 46.6004336],
  ],
  0.35,
);

/**
 * Resciesa → Rifugio Firenze on mapped footpaths across Val Gardena. This
 * is simplified OpenStreetMap foot-routing geometry, not a recorded GPX.
 */
export const trailResciesaFirenze: LngLat[] = densify(
  [
    [11.6621496, 46.6004336],
    [11.66195, 46.600317],
    [11.679412, 46.593916],
    [11.671638, 46.592196],
    [11.674734, 46.589731],
    [11.67581, 46.589452],
    [11.673946, 46.588937],
    [11.672662, 46.589513],
    [11.672865, 46.588323],
    [11.678111, 46.587088],
    [11.679469, 46.588249],
    [11.680387, 46.58819],
    [11.682194, 46.585762],
    [11.683069, 46.585659],
    [11.682062, 46.585309],
    [11.687354, 46.584502],
    [11.685189, 46.583968],
    [11.688172, 46.583198],
    [11.693183, 46.583969],
    [11.694172, 46.584292],
    [11.694516, 46.585134],
    [11.700086, 46.586794],
    [11.701041, 46.587915],
    [11.703147, 46.588341],
    [11.705899, 46.589858],
    [11.706489, 46.591247],
    [11.709364, 46.592386],
    [11.711074, 46.594262],
    [11.712546, 46.594634],
    [11.713136, 46.594551],
    [11.71329, 46.593159],
    [11.714757, 46.591571],
    [11.716016, 46.593406],
    [11.71652, 46.593407],
    [11.718262, 46.590504],
    [11.721835, 46.587842],
    [11.723512, 46.590122],
    [11.722428, 46.590831],
    [11.726704, 46.592378],
    [11.72734, 46.593272],
    [11.728801, 46.593608],
    [11.730474, 46.595005],
    [11.734553, 46.595497],
    [11.735555, 46.59518],
    [11.735904, 46.594094],
    [11.738366, 46.593217],
    [11.738068, 46.592095],
    [11.738454, 46.590482],
    [11.742133, 46.590735],
    [11.743155, 46.589724],
    [11.744369, 46.589476],
    [11.745257, 46.587183],
    [11.74624, 46.586434],
    [11.750243, 46.586243],
    [11.753565, 46.586995],
    [11.755055, 46.587973],
    [11.757702, 46.587889],
    [11.758148, 46.587361],
    [11.758318, 46.587434],
  ],
  0.28,
);

export const MUNICH_HBF: LngLat = [11.5583, 48.1402];
export const INNSBRUCK_HBF: LngLat = [11.401, 47.2634];
export const BOLZANO: LngLat = [11.357, 46.498];
export const ORTISEI: LngLat = [11.6717, 46.5761];
/** Rifugio Resciesa / Raschötzhütte, 2,170 m. */
export const RESCIESA: LngLat = [11.6621496, 46.6004336];
/** Rifugio Firenze / Regensburger Hütte, in Val Cisles. */
export const FIRENZE: LngLat = [11.758318, 46.587434];
/** Seceda summit ridge, ~2519 m. */
export const SECEDA: LngLat = [11.7257836, 46.6005922];
/** Eastern end of the walkable Seceda crest, beyond the summit viewpoint. */
export const SECEDA_RIDGE_END: LngLat = [11.736028, 46.601322];
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

/**
 * Firenze up Val Cisles to the Seceda summit ridge. Simplified OpenStreetMap
 * foot-routing geometry, not a recorded GPX trace.
 */
export const trailFirenzeSeceda: LngLat[] = densify(
  [
    FIRENZE,
    [11.758148, 46.587361],
    [11.757702, 46.587889],
    [11.755055, 46.587973],
    [11.753565, 46.586995],
    [11.750243, 46.586243],
    [11.74624, 46.586434],
    [11.745257, 46.587183],
    [11.744369, 46.589476],
    [11.743155, 46.589724],
    [11.742133, 46.590735],
    [11.738454, 46.590482],
    [11.738068, 46.592095],
    [11.738366, 46.593217],
    [11.735904, 46.594094],
    [11.735555, 46.59518],
    [11.734741, 46.595479],
    [11.730474, 46.595005],
    [11.728801, 46.593608],
    [11.726642, 46.592963],
    [11.726563, 46.594682],
    [11.728632, 46.596355],
    [11.72945, 46.597822],
    [11.725907, 46.597365],
    [11.724638, 46.596395],
    [11.724778, 46.597928],
    [11.724147, 46.598893],
    [11.725784, 46.600592],
    SECEDA,
    [11.727258, 46.600781],
    [11.730947, 46.600631],
    [11.734314, 46.601181],
    [11.735381, 46.601289],
    SECEDA_RIDGE_END,
  ],
  0.2,
);

/**
 * Seceda down to Ortisei by gondola. The lift itself runs in two dead-straight
 * spans (summit station → Furnes mid-station → Ortisei) — no wiggle, unlike
 * the hiking legs. The opening points retrace the crest from its eastern
 * viewpoint to the summit, then cover the short walk to the lift's top station.
 */
export const gondolaSecedaOrtisei: LngLat[] = densify(
  [
    SECEDA_RIDGE_END,
    [11.735381, 46.601289],
    [11.734314, 46.601181],
    [11.730947, 46.600631],
    [11.727258, 46.600781],
    SECEDA,
    [11.7243474, 46.597936], // Seceda summit station
    [11.7023249, 46.589805], // Furnes cable-car station
    [11.7021929, 46.5896654], // Furnes gondola station
    [11.6960016, 46.5866463],
    [11.6897575, 46.5836022],
    [11.6834791, 46.5805268],
    [11.6781491, 46.5779237],
    [11.6750721, 46.5764208], // Ortisei valley station
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
    stopIds: ["muc", "wombat"],
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
    id: "wombat",
    lngLat: WOMBAT,
    photo: photos.wombatExterior,
    secondaryPhoto: photos.wombatCourtyard,
    additionalPhotos: [photos.wombatDorm],
    caption: "Wombat's City Hostel",
    days: [2, 3, 4],
    clusterId: "munich",
    minZoom: 13,
    variant: "stack",
    offset: [0, -18],
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
    photo: photos.seceda,
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
