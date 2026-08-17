import {
  flightHome,
  flightOut,
  MCI,
  stopClusters,
  trailTForDay,
} from "@/data/route";
import { days, journeyFrame } from "@/data/trip";
import type { MapFrame } from "@/data/types";
import {
  along,
  clamp,
  lerp,
  lerpBearing,
  lerpBounds,
  lerpLngLat,
  type LngLat,
} from "@/lib/geo";

export type JourneyPhase = "overview" | "mci" | "flight" | "day";
export type FlightLeg = "out" | "home" | null;

export type JourneyView = {
  phase: JourneyPhase;
  bounds: MapFrame["bounds"];
  center?: LngLat;
  zoom?: number;
  pitch: number;
  bearing: number;
  showFlight: boolean;
  flightT: number;
  flightLeg: FlightLeg;
  trailT: number;
  dayId: number | null;
  label: string;
  expandedClusterIds: string[];
  visitedClusterIds: string[];
};

const FREEZE = 0.5;

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

export const OVERVIEW: JourneyView = {
  phase: "overview",
  bounds: journeyFrame.bounds,
  pitch: journeyFrame.pitch ?? 36,
  bearing: journeyFrame.bearing ?? 8,
  showFlight: false,
  flightT: 0,
  flightLeg: null,
  trailT: 0,
  dayId: null,
  label: "The route",
  expandedClusterIds: [],
  visitedClusterIds: [],
};

function mciView(): JourneyView {
  return {
    phase: "mci",
    bounds: [-94.86, 39.18, -94.56, 39.42],
    center: MCI,
    zoom: 11.35,
    pitch: 32,
    bearing: -22,
    showFlight: false,
    flightT: 0,
    flightLeg: "out",
    trailT: 0,
    dayId: 1,
    label: "Kansas City · MCI",
    expandedClusterIds: [],
    visitedClusterIds: [],
  };
}

function flightZoom(t: number, start: number, mid: number, end: number) {
  if (t < 0.14) return lerp(start, mid, t / 0.14);
  if (t < 0.78) return lerp(mid, mid - 0.45, (t - 0.14) / 0.64);
  return lerp(mid - 0.45, end, (t - 0.78) / 0.22);
}

function flightOutView(t: number): JourneyView {
  const u = clamp(t);
  const plane = along(flightOut, u);
  const pitch =
    u < 0.12 ? lerp(32, 18, u / 0.12) : u < 0.82 ? 18 : lerp(18, 26, (u - 0.82) / 0.18);
  return {
    phase: "flight",
    bounds: [-98, 32, 18, 56],
    center: plane,
    zoom: flightZoom(u, 11.1, 3.85, 7.1),
    pitch,
    bearing: 0,
    showFlight: true,
    flightT: Math.max(0.004, u),
    flightLeg: "out",
    trailT: 0,
    dayId: 1,
    label: "MCI → Munich",
    expandedClusterIds: [],
    visitedClusterIds: [],
  };
}

function flightHomeView(t: number): JourneyView {
  const u = clamp(t);
  const plane = along(flightHome, u);
  return {
    phase: "flight",
    bounds: [-98, 32, 18, 56],
    center: plane,
    zoom: flightZoom(u, 8.2, 3.7, 10.4),
    pitch: u < 0.15 ? lerp(28, 16, u / 0.15) : 16,
    bearing: 0,
    showFlight: true,
    flightT: Math.max(0.004, u),
    flightLeg: "home",
    trailT: 1,
    dayId: 10,
    label: "Venice → MCI",
    expandedClusterIds: [],
    visitedClusterIds: ["munich", "innsbruck", "dolomites", "venice"],
  };
}

function viewForDay(dayId: number): JourneyView {
  const day = days[dayId - 1];
  const clusters = clusterState(dayId);
  return {
    phase: "day",
    bounds: day.mapFrame.bounds,
    pitch: day.mapFrame.pitch ?? (day.isHikeDay ? 58 : 28),
    bearing: day.mapFrame.bearing ?? 0,
    showFlight: false,
    flightT: 0,
    flightLeg: null,
    trailT: trailTForDay(dayId),
    dayId,
    label: `Day ${day.id} · ${day.stripLabel}`,
    ...clusters,
  };
}

function mix(a: JourneyView, b: JourneyView, t: number): JourneyView {
  const u = clamp(t);
  const pick = u < 0.5 ? a : b;
  return {
    phase: pick.phase,
    bounds: lerpBounds(a.bounds, b.bounds, u),
    center:
      a.center && b.center
        ? lerpLngLat(a.center, b.center, u)
        : pick.center,
    zoom:
      a.zoom != null && b.zoom != null ? lerp(a.zoom, b.zoom, u) : pick.zoom,
    pitch: lerp(a.pitch, b.pitch, u),
    bearing: lerpBearing(a.bearing, b.bearing, u),
    showFlight: pick.showFlight,
    flightT: lerp(a.flightT, b.flightT, u),
    flightLeg: pick.flightLeg,
    trailT: lerp(a.trailT, b.trailT, u),
    dayId: pick.dayId,
    label: pick.label,
    expandedClusterIds: pick.expandedClusterIds,
    visitedClusterIds: pick.visitedClusterIds,
  };
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
  const anchor = viewportHeight * 0.38;

  if (!(hero instanceof HTMLElement)) return OVERVIEW;

  const heroRect = hero.getBoundingClientRect();
  if (heroRect.bottom > viewportHeight * FREEZE) {
    return OVERVIEW;
  }

  if (crossing instanceof HTMLElement) {
    const rect = crossing.getBoundingClientRect();
    if (rect.bottom > viewportHeight * 0.38) {
      const span = Math.max(1, rect.height - viewportHeight * 0.35);
      const t = clamp((viewportHeight * FREEZE - rect.top) / span);
      if (t < 0.1) return mciView();
      return flightOutView((t - 0.1) / 0.9);
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

  if (dayId === 10) {
    if (!next) {
      const bottom = current.getBoundingClientRect().bottom;
      if (bottom < viewportHeight * 0.35) {
        return { ...OVERVIEW, trailT: 1, label: "The route" };
      }
    }
    if (t < 0.18) return viewForDay(10);
    return flightHomeView((t - 0.18) / 0.82);
  }

  if (!next) {
    const bottom = current.getBoundingClientRect().bottom;
    if (bottom < viewportHeight * 0.35) {
      return { ...OVERVIEW, trailT: 1, label: "The route" };
    }
    return viewForDay(dayId);
  }

  return mix(viewForDay(dayId), viewForDay(Number(next.dataset.day)), t);
}
