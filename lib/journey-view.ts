import {
  EISBACHWELLE,
  flightHome,
  flightOut,
  MONTAGU,
  MUC,
  ORTISEI,
  PUEZ,
  RESCIESA,
  stopClusters,
  trailTForDay,
  VCE,
  VENICE,
  WOMBAT,
} from "@/data/route";
import { days, journeyFrame } from "@/data/trip";
import {
  clamp,
  lerp,
  lerpBearing,
  lerpLngLat,
  smoothstep,
  type LngLat,
} from "@/lib/geo";

export type JourneyPhase = "overview" | "mci" | "flight" | "day";
export type FlightLeg = "out" | "home" | null;

export type JourneyView = {
  phase: JourneyPhase;
  bounds: [number, number, number, number];
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
  showFlight: boolean;
  flightT: number;
  flightLeg: FlightLeg;
  trailT: number;
  voxelOpacity: number;
  climbM: number;
  jump: boolean;
  dayId: number | null;
  label: string;
  expandedClusterIds: string[];
  visitedClusterIds: string[];
};

const FREEZE = 0.52;
const HOLD = 0.74;

function clusterState(dayId: number | null) {
  if (dayId == null) {
    return { expandedClusterIds: [] as string[], visitedClusterIds: [] as string[] };
  }
  const expandedClusterIds: string[] = [];
  const visitedClusterIds: string[] = [];
  for (const cluster of stopClusters) {
    const lo = Math.min(...cluster.expandOnDays);
    const hi = Math.max(...cluster.expandOnDays);
    if (dayId >= lo && dayId <= hi) expandedClusterIds.push(cluster.id);
    else if (dayId > hi) visitedClusterIds.push(cluster.id);
  }
  return { expandedClusterIds, visitedClusterIds };
}

function pose(
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
  return {
    bounds: journeyFrame.bounds,
    jump: false,
    voxelOpacity: 0,
    climbM: 1200,
    expandedClusterIds: clusters.expandedClusterIds,
    visitedClusterIds: clusters.visitedClusterIds,
    ...partial,
  };
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
  jump: true,
  dayId: null,
  label: "The route",
  expandedClusterIds: [],
  visitedClusterIds: [],
});

const ATLANTIC_CENTER: LngLat = [-41.5, 47.2];
const ATLANTIC_ZOOM = 3.05;

function worldDepartView(): JourneyView {
  return pose({
    phase: "flight",
    center: ATLANTIC_CENTER,
    zoom: ATLANTIC_ZOOM,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT: 0.006,
    flightLeg: "out",
    trailT: 0,
    jump: true,
    dayId: 1,
    label: "Kansas City → Munich",
    expandedClusterIds: [],
    visitedClusterIds: [],
  });
}

function flightOutView(t: number): JourneyView {
  const u = clamp(t);
  const zoom =
    u < 0.84
      ? ATLANTIC_ZOOM
      : lerp(ATLANTIC_ZOOM, 6.8, smoothstep((u - 0.84) / 0.16));
  const center =
    u < 0.84
      ? ATLANTIC_CENTER
      : lerpLngLat(ATLANTIC_CENTER, MUC, smoothstep((u - 0.84) / 0.16));
  return pose({
    phase: "flight",
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT: Math.max(0.006, u),
    flightLeg: "out",
    trailT: 0,
    jump: false,
    dayId: 1,
    label: "Kansas City → Munich",
    expandedClusterIds: [],
    visitedClusterIds: [],
  });
}

function flightHomeView(t: number): JourneyView {
  const u = clamp(t);
  const zoom =
    u < 0.16
      ? lerp(6.4, ATLANTIC_ZOOM, smoothstep(u / 0.16))
      : ATLANTIC_ZOOM;
  const center =
    u < 0.16
      ? lerpLngLat(VCE, ATLANTIC_CENTER, smoothstep(u / 0.16))
      : ATLANTIC_CENTER;
  return pose({
    phase: "flight",
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT: Math.max(0.006, u),
    flightLeg: "home",
    trailT: 1,
    voxelOpacity: 0,
    jump: false,
    dayId: 10,
    label: "Venice → Kansas City",
    expandedClusterIds: [],
    visitedClusterIds: ["munich", "innsbruck", "dolomites", "venice"],
  });
}

function viewForDay(dayId: number): JourneyView {
  const day = days[dayId - 1];
  const cameras: Record<
    number,
    {
      center: LngLat;
      zoom: number;
      pitch: number;
      bearing: number;
      voxel?: number;
      climb?: number;
    }
  > = {
    1: { center: MUC, zoom: 11.3, pitch: 0, bearing: 0 },
    2: { center: WOMBAT, zoom: 13.55, pitch: 0, bearing: 0 },
    3: { center: EISBACHWELLE, zoom: 14.05, pitch: 0, bearing: 0 },
    4: { center: MONTAGU, zoom: 13.35, pitch: 0, bearing: 0 },
    5: {
      center: ORTISEI,
      zoom: 12.85,
      pitch: 0,
      bearing: 8,
      voxel: 0.55,
      climb: 1250,
    },
    6: {
      center: [11.742, 46.604],
      zoom: 12.95,
      pitch: 54,
      bearing: 26,
      voxel: 1,
      climb: 2100,
    },
    7: {
      center: PUEZ,
      zoom: 13.15,
      pitch: 58,
      bearing: 38,
      voxel: 1,
      climb: 2480,
    },
    8: {
      center: [11.825, 46.562],
      zoom: 12.55,
      pitch: 44,
      bearing: 16,
      voxel: 0.85,
      climb: 1800,
    },
    9: { center: VENICE, zoom: 13.7, pitch: 0, bearing: 0 },
    10: { center: VCE, zoom: 12.6, pitch: 0, bearing: 0 },
  };
  const cam = cameras[dayId];
  return pose({
    phase: "day",
    center: cam.center,
    zoom: cam.zoom,
    pitch: cam.pitch,
    bearing: cam.bearing,
    showFlight: false,
    flightT: dayId === 1 ? 1 : 0,
    flightLeg: dayId === 1 ? "out" : null,
    trailT: trailTForDay(dayId),
    voxelOpacity: cam.voxel ?? 0,
    climbM: cam.climb ?? 1200,
    jump: false,
    dayId,
    label: `Day ${day.id} · ${day.stripLabel}`,
  });
}

function climbView(): JourneyView {
  return pose({
    phase: "day",
    center: RESCIESA,
    zoom: 13.05,
    pitch: 48,
    bearing: 18,
    showFlight: false,
    flightT: 0,
    flightLeg: null,
    trailT: trailTForDay(5),
    voxelOpacity: 1,
    climbM: 2200,
    jump: false,
    dayId: 5,
    label: "Day 5 · Ortisei",
  });
}

function mix(a: JourneyView, b: JourneyView, t: number): JourneyView {
  const u = smoothstep(t);
  const pick = u < 0.5 ? a : b;
  return {
    phase: pick.phase,
    bounds: pick.bounds,
    center: lerpLngLat(a.center, b.center, u),
    zoom: lerp(a.zoom, b.zoom, u),
    pitch: lerp(a.pitch, b.pitch, u),
    bearing: lerpBearing(a.bearing, b.bearing, u),
    showFlight: pick.showFlight,
    flightT: lerp(a.flightT, b.flightT, u),
    flightLeg: pick.flightLeg,
    trailT: lerp(a.trailT, b.trailT, u),
    voxelOpacity: lerp(a.voxelOpacity, b.voxelOpacity, u),
    climbM: lerp(a.climbM, b.climbM, u),
    jump: false,
    dayId: pick.dayId,
    label: pick.label,
    expandedClusterIds: pick.expandedClusterIds,
    visitedClusterIds: pick.visitedClusterIds,
  };
}

function holdThen(current: JourneyView, next: JourneyView, t: number) {
  if (t < HOLD) return current;
  return mix(current, next, (t - HOLD) / (1 - HOLD));
}

function sectionProgress(
  current: HTMLElement,
  next: HTMLElement | undefined,
  anchor: number,
) {
  const start = current.getBoundingClientRect().top;
  const end = next
    ? next.getBoundingClientRect().top
    : current.getBoundingClientRect().bottom;
  const span = end - start;
  return span <= 0 ? 0 : clamp((anchor - start) / span);
}

export function readJourneyView(
  hero: HTMLElement | null,
  crossing: HTMLElement | null,
  sections: HTMLElement[],
  viewportHeight: number,
): JourneyView {
  const anchor = viewportHeight * 0.4;

  if (!(hero instanceof HTMLElement)) return OVERVIEW;

  const heroRect = hero.getBoundingClientRect();
  if (heroRect.bottom > viewportHeight * FREEZE) {
    return OVERVIEW;
  }

  if (crossing instanceof HTMLElement) {
    const rect = crossing.getBoundingClientRect();
    if (rect.bottom > viewportHeight * 0.4) {
      const span = Math.max(1, rect.height - viewportHeight * 0.32);
      const t = clamp((viewportHeight * FREEZE - rect.top) / span);
      if (t < 0.16) return worldDepartView();
      return flightOutView((t - 0.16) / 0.84);
    }
  }

  if (sections.length === 0) return OVERVIEW;

  let index = 0;
  for (let i = 0; i < sections.length; i += 1) {
    if (sections[i].getBoundingClientRect().top <= anchor) index = i;
    else break;
  }

  const current = sections[index];
  const next = sections[index + 1];
  const dayId = Number(current.dataset.day);
  const t = sectionProgress(current, next, anchor);

  if (dayId === 5) {
    const start = viewForDay(5);
    const climb = climbView();
    if (t < 0.38) return start;
    if (t < 0.78) return mix(start, climb, (t - 0.38) / 0.4);
    return next
      ? mix(climb, viewForDay(Number(next.dataset.day)), (t - 0.78) / 0.22)
      : climb;
  }

  if (dayId === 10) {
    if (!next) {
      const bottom = current.getBoundingClientRect().bottom;
      if (bottom < viewportHeight * 0.32) {
        return { ...OVERVIEW, trailT: 1, label: "The route", jump: false };
      }
    }
    if (t < 0.28) return viewForDay(10);
    return flightHomeView((t - 0.28) / 0.72);
  }

  if (!next) {
    const bottom = current.getBoundingClientRect().bottom;
    if (bottom < viewportHeight * 0.32) {
      return { ...OVERVIEW, trailT: 1, label: "The route", jump: false };
    }
    return viewForDay(dayId);
  }

  return holdThen(viewForDay(dayId), viewForDay(Number(next.dataset.day)), t);
}
