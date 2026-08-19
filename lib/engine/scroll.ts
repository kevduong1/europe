import { clamp } from "./geo";
import { ANCHOR, FREEZE, HANDOFF } from "./pacing";
import { holdThen, mix } from "./camera";
import type { JourneyView, TripRegistry } from "./types";

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

function indexAtAnchor(elements: HTMLElement[], anchor: number) {
  let index = -1;
  for (let i = 0; i < elements.length; i += 1) {
    if (elements[i].getBoundingClientRect().top <= anchor) index = i;
    else break;
  }
  return index;
}

function viewForDay(registry: TripRegistry, dayId: number) {
  return registry.day(dayId)?.enterView ?? registry.overview;
}

function viewForBeat(
  registry: TripRegistry,
  dayId: number,
  beatId: string,
  progress: number,
) {
  return registry.beat(dayId, beatId)?.view(progress) ?? viewForDay(registry, dayId);
}

function readDayBeats(
  registry: TripRegistry,
  current: HTMLElement,
  next: HTMLElement | undefined,
  anchor: number,
): JourneyView {
  const dayId = Number(current.dataset.day);
  const beats = [...current.querySelectorAll<HTMLElement>("[data-beat]")];
  if (beats.length === 0) {
    const progress = sectionProgress(current, next, anchor);
    return next
      ? holdThen(
          viewForDay(registry, dayId),
          viewForDay(registry, Number(next.dataset.day)),
          progress,
        )
      : viewForDay(registry, dayId);
  }

  const index = indexAtAnchor(beats, anchor);
  if (index < 0) {
    const first = beats[0];
    return first
      ? viewForBeat(registry, dayId, first.dataset.beat ?? "", 0)
      : viewForDay(registry, dayId);
  }

  const beat = beats[index];
  const beatId = beat.dataset.beat ?? "";
  const following = beats[index + 1];
  const progress = sectionProgress(beat, following ?? next, anchor);
  const view = viewForBeat(registry, dayId, beatId, progress);
  const handoff = registry.beat(dayId, beatId)?.handoff ?? HANDOFF;
  if (!following && next && progress > handoff) {
    const nextDayId = Number(next.dataset.day);
    const nextBeat = next.querySelector<HTMLElement>("[data-beat]");
    const incoming = nextBeat
      ? viewForBeat(registry, nextDayId, nextBeat.dataset.beat ?? "", 0)
      : viewForDay(registry, nextDayId);
    return mix(view, incoming, (progress - handoff) / (1 - handoff));
  }
  return view;
}

/** Maps the current scroll position to a pure camera frame. */
export function readJourneyView(
  registry: TripRegistry,
  hero: HTMLElement | null,
  sections: HTMLElement[],
  viewportHeight: number,
): JourneyView {
  if (!(hero instanceof HTMLElement)) return registry.overview;
  if (hero.getBoundingClientRect().bottom > viewportHeight * FREEZE) {
    return registry.overview;
  }
  if (sections.length === 0) return registry.overview;

  const anchor = viewportHeight * ANCHOR;
  const index = Math.max(0, indexAtAnchor(sections, anchor));
  const current = sections[index];
  const next = sections[index + 1];
  const finalDayId = registry.days.at(-1)?.id;
  if (Number(current.dataset.day) === finalDayId && !next) {
    if (current.getBoundingClientRect().bottom < viewportHeight * 0.32) {
      return { ...registry.overview, trailT: 1 };
    }
  }
  return readDayBeats(registry, current, next, anchor);
}
