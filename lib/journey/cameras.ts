import { legT, MUC, WOMBAT } from "@/data/route";
import { clamp, lerp, lerpLngLat, smoothstep, type LngLat } from "@/lib/geo";
import { CLUSTERS, clusterState } from "./clusters";
import type { JourneyView } from "./types";

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
  /** Tight, pitched shot atop Seceda — the Odle ridge is the point of the stop. */
  seceda: {
    center: [11.6893, 46.6106] as LngLat,
    zoom: 14.1,
    pitch: 52,
    bearing: 18,
  },
  /**
   * The gondola drop, not a traverse — steeper pitch than `dolomites`,
   * bearing turned to face down-valley toward Ortisei (~186°, the line's own
   * direction) so the ~1000 m loss reads as falling away in front of you.
   */
  secedaDrop: {
    center: [11.68, 46.593] as LngLat,
    zoom: 13,
    pitch: 60,
    bearing: 186,
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
    localRouteId: partial.localRouteId ?? null,
    localRouteT: clamp(partial.localRouteT ?? 0),
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

/** Named phase boundaries for `flightOutView` — pull-out span and descent span are derived, not repeated. */
const PULL_OUT_START = 0.1;
const PULL_OUT_END = 0.26;
const PULL_OUT_SPAN = PULL_OUT_END - PULL_OUT_START;
const DESCENT_START = 0.64;
const DESCENT_END = 0.86;
const DESCENT_SPAN = DESCENT_END - DESCENT_START;
/** Final few kilometres: close enough to remain inside the runway camera. */
const MUC_APPROACH_START = 0.9994;

/** Hold over the plains, pull out over the ocean, then drop onto Munich. */
export function flightOutView(t: number): JourneyView {
  const u = clamp(t);
  let zoom: number;
  let center: LngLat;
  if (u < PULL_OUT_START) {
    zoom = USA_ZOOM;
    center = USA_CENTER;
  } else if (u < PULL_OUT_END) {
    const k = smoothstep((u - PULL_OUT_START) / PULL_OUT_SPAN);
    zoom = lerp(USA_ZOOM, OCEAN_ZOOM, k);
    center = lerpLngLat(USA_CENTER, ATLANTIC_CENTER, k);
  } else if (u < DESCENT_START) {
    zoom = OCEAN_ZOOM;
    center = ATLANTIC_CENTER;
  } else {
    const k = smoothstep(clamp((u - DESCENT_START) / DESCENT_SPAN));
    zoom = lerp(OCEAN_ZOOM, CITY.munichAirport.zoom, k);
    center = lerpLngLat(ATLANTIC_CENTER, CITY.munichAirport.center, k);
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

/** Touchdown: read the full approach, then hold briefly before going to ground. */
export function mucArrival(t: number): JourneyView {
  const u = clamp(t);
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
