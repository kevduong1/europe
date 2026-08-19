import { cityHold, pose } from "@/lib/engine/camera";
import type { JourneyView, LngLat } from "@/lib/engine/types";
import { legT, WOMBAT } from "./geometry/legs";
import { CLUSTERS } from "./clusters";

export { cityHold, pose };

/**
 * Where each named place falls along the continuous Europe trail, 0..1.
 * Derived from exact leg boundaries (`legT`), not a nearest-point search —
 * Ortisei and Bolzano are each crossed twice (in and back out), so a fuzzy
 * search can't tell which pass it found.
 */
export const T = {
  hbf: legT.munichInnsbruck.start,
  innsbruck: legT.munichInnsbruck.end,
  // Montagu Hostel is a stone's throw from the Hbf — same point on the trail.
  montagu: legT.munichInnsbruck.end,
  bolzano: legT.innsbruckBolzano.end,
  ortisei: legT.bolzanoOrtisei.end,
  resciesa: legT.ortiseiResciesa.end,
  firenze: legT.resciesaFirenze.end,
  seceda: legT.firenzeSeceda.end,
  // Second pass through Ortisei, descending from the Seceda cable car.
  ortiseiBack: legT.secedaOrtisei.end,
  qcTerme: legT.ortiseiValDiFassa.end,
  // Second pass through Bolzano, on the way out to Venice.
  bolzanoOut: legT.fassaBolzano.end,
  venice: 1,
};

export const CITY = {
  munich: {
    center: [11.575, 48.145] as LngLat,
    zoom: 11.38,
    pitch: 0,
    bearing: 0,
  },
  munichAirport: {
    center: [11.7861, 48.3538] as LngLat,
    zoom: 11.72,
    pitch: 38,
    bearing: 128,
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
    center: [11.71, 46.592] as LngLat,
    zoom: 12.02,
    pitch: 38,
    bearing: 16,
  },
  /** Close ridge view for the first hut night above Ortisei. */
  resciesa: {
    center: [11.6621496, 46.6004336] as LngLat,
    zoom: 14,
    pitch: 48,
    bearing: 112,
  },
  /** Close view of the hut and the southern foot of the Odle group. */
  firenze: {
    center: [11.758318, 46.587434] as LngLat,
    zoom: 14.1,
    pitch: 50,
    bearing: -18,
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
  /**
   * Tight, pitched shot across Seceda toward the Odle ridge. The camera target
   * sits northeast of the summit so Seceda lands in the open right side of
   * the frame instead of underneath the story and photo cards.
   */
  seceda: {
    center: [11.7335, 46.6055] as LngLat,
    zoom: 14.28,
    pitch: 52,
    bearing: 104,
  },
  /**
   * The gondola drop, not a traverse — steeper pitch than `dolomites`,
   * bearing turned to face down-valley toward Ortisei (~237°, the line's own
   * direction) so the ~1000 m loss reads as falling away in front of you.
   */
  secedaDrop: {
    center: [11.7, 46.589] as LngLat,
    zoom: 13,
    pitch: 60,
    bearing: 237,
  },
  /** Wide corridor for Ortisei → Val di Fassa over Passo Sella via Canazei. */
  toValDiFassa: {
    center: [11.72, 46.5] as LngLat,
    zoom: 10.3,
    pitch: 0,
    bearing: -6,
  },
  /** Tight shot on QC Terme Dolomiti — the spa afternoon. */
  qcTerme: {
    center: [11.6889, 46.4283] as LngLat,
    zoom: 14.5,
    pitch: 10,
    bearing: 0,
  },
  /** Wide corridor for Val di Fassa → Bolzano over Passo Costalunga. */
  fassaBolzano: {
    center: [11.5, 46.45] as LngLat,
    zoom: 9.9,
    pitch: 0,
    bearing: -10,
  },
  /** Wide southbound frame for the Bolzano → Venice rail, Verona to the lagoon. */
  toVenice: {
    center: [11.55, 45.95] as LngLat,
    zoom: 7.2,
    pitch: 0,
    bearing: 4,
  },
  /** Zoomed-in walk up the Englischer Garten. */
  englishGarden: {
    center: [11.591, 48.153] as LngLat,
    zoom: 14.4,
    pitch: 10,
    bearing: 0,
  },
  /** The showpiece: tight and rotating onto the Hofbräuhaus. */
  hofbrauhaus: {
    center: [11.5799, 48.1376] as LngLat,
    zoom: 15.35,
    pitch: 28,
    bearing: 68,
  },
};

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

export function munichStay(
  dayId: number,
  label: string,
  extra?: {
    here?: LngLat;
    focusStopId?: string | null;
    amount?: number;
    focus?: LngLat;
  },
): JourneyView {
  const focusStopId =
    extra && "focusStopId" in extra ? extra.focusStopId : "wombat";
  return cityHold(CITY.munich, {
    dayId,
    label,
    trailT: 0,
    here: extra?.here ?? WOMBAT,
    focusStopId,
    focus: extra?.focus ?? extra?.here,
    amount: extra?.amount ?? 0,
    expandedClusterIds: CLUSTERS.munich,
    visitedClusterIds: CLUSTERS.none,
  });
}
