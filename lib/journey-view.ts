import { trailTForDay } from "@/data/route";
import { days, journeyFrame } from "@/data/trip";
import type { MapFrame } from "@/data/types";
import { lerp, lerpBounds } from "@/lib/geo";

export type JourneyView = {
  bounds: MapFrame["bounds"];
  showFlight: boolean;
  trailT: number;
  dayId: number | null;
  label: string;
};

const OVERVIEW: JourneyView = {
  bounds: journeyFrame.bounds,
  showFlight: false,
  trailT: 0,
  dayId: null,
  label: "The route",
};

function viewForDay(dayId: number): JourneyView {
  const day = days[dayId - 1];
  return {
    bounds: day.mapFrame.bounds,
    showFlight: Boolean(day.mapFrame.showFlight),
    trailT: trailTForDay(dayId),
    dayId,
    label: `Day ${day.id} · ${day.stripLabel}`,
  };
}

function mix(a: JourneyView, b: JourneyView, t: number): JourneyView {
  const u = Math.min(1, Math.max(0, t));
  return {
    bounds: lerpBounds(a.bounds, b.bounds, u),
    showFlight: u < 0.55 ? a.showFlight : b.showFlight,
    trailT: lerp(a.trailT, b.trailT, u),
    dayId: u < 0.5 ? a.dayId : b.dayId,
    label: u < 0.5 ? a.label : b.label,
  };
}

export function readJourneyView(
  hero: HTMLElement | null,
  sections: HTMLElement[],
  viewportHeight: number,
): JourneyView {
  const anchor = viewportHeight * 0.36;

  if (!hero || sections.length === 0) return OVERVIEW;

  const heroRect = hero.getBoundingClientRect();
  if (heroRect.bottom > viewportHeight * 0.7) {
    return OVERVIEW;
  }

  if (heroRect.bottom > anchor) {
    const span = viewportHeight * 0.7 - anchor;
    const t = span <= 0 ? 1 : 1 - (heroRect.bottom - anchor) / span;
    return mix(OVERVIEW, viewForDay(1), t);
  }

  let index = 0;
  for (let i = 0; i < sections.length; i += 1) {
    if (sections[i].getBoundingClientRect().top <= anchor) index = i;
    else break;
  }

  const current = sections[index];
  const next = sections[index + 1];
  const dayId = Number(current.dataset.day);
  const from = viewForDay(dayId);

  if (!next) {
    const bottom = current.getBoundingClientRect().bottom;
    if (bottom < viewportHeight * 0.35) {
      return { ...OVERVIEW, trailT: 1, label: "The route" };
    }
    return from;
  }

  const start = current.getBoundingClientRect().top;
  const end = next.getBoundingClientRect().top;
  const span = end - start;
  const t = span <= 0 ? 0 : (anchor - start) / span;
  return mix(from, viewForDay(Number(next.dataset.day)), t);
}
