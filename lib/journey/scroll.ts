import { clamp } from "@/lib/geo";
import { viewForBeat, viewForDay } from "./beats";
import { OVERVIEW } from "./cameras";
import { ANCHOR, BEAT_HANDOFF, FREEZE, HANDOFF } from "./pacing";
import { holdThen, mix } from "./transitions";
import type { JourneyView } from "./types";

/** Progress of `current` under the anchor line, 0..1, ending where `next` begins. */
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

/** Last element whose top has passed the anchor, or -1 if none have. */
function indexAtAnchor(elements: HTMLElement[], anchor: number) {
  let index = -1;
  for (let i = 0; i < elements.length; i += 1) {
    if (elements[i].getBoundingClientRect().top <= anchor) index = i;
    else break;
  }
  return index;
}

function readDayBeats(
  current: HTMLElement,
  next: HTMLElement | undefined,
  anchor: number,
): JourneyView {
  const dayId = Number(current.dataset.day);
  const beats = [...current.querySelectorAll<HTMLElement>("[data-beat]")];
  if (beats.length === 0) {
    const t = sectionProgress(current, next, anchor);
    return next
      ? holdThen(viewForDay(dayId), viewForDay(Number(next.dataset.day)), t)
      : viewForDay(dayId);
  }

  const index = indexAtAnchor(beats, anchor);
  if (index < 0) {
    const first = beats[0];
    return first
      ? viewForBeat(dayId, first.dataset.beat ?? "", 0)
      : viewForDay(dayId);
  }

  const beat = beats[index];
  const following = beats[index + 1];
  const t = sectionProgress(beat, following ?? next, anchor);
  const view = viewForBeat(dayId, beat.dataset.beat ?? "", t);
  const handoff = BEAT_HANDOFF[beat.dataset.beat ?? ""] ?? HANDOFF;
  if (!following && next && t > handoff) {
    const nextDayId = Number(next.dataset.day);
    const nextBeat = next.querySelector<HTMLElement>("[data-beat]");
    const incoming = nextBeat
      ? viewForBeat(nextDayId, nextBeat.dataset.beat ?? "", 0)
      : viewForDay(nextDayId);
    return mix(view, incoming, (t - handoff) / (1 - handoff));
  }
  return view;
}

/** Maps the current scroll position to the camera the map should be showing. */
export function readJourneyView(
  hero: HTMLElement | null,
  sections: HTMLElement[],
  viewportHeight: number,
): JourneyView {
  if (!(hero instanceof HTMLElement)) return OVERVIEW;
  if (hero.getBoundingClientRect().bottom > viewportHeight * FREEZE) {
    return OVERVIEW;
  }
  if (sections.length === 0) return OVERVIEW;

  const anchor = viewportHeight * ANCHOR;
  const index = Math.max(0, indexAtAnchor(sections, anchor));
  const current = sections[index];
  const next = sections[index + 1];

  if (Number(current.dataset.day) === 10 && !next) {
    if (current.getBoundingClientRect().bottom < viewportHeight * 0.32) {
      return { ...OVERVIEW, trailT: 1 };
    }
  }

  return readDayBeats(current, next, anchor);
}
