import type { Day, DayModule, TripRegistry, JourneyView } from "./types";

/** Beat ids that Timeline actually renders, including an independent lodging row. */
export function renderedBeatIds(day: Day) {
  const ids = day.timeline.map((item) => item.id);
  const lodgingAlreadyOnTimeline = day.timeline.some(
    (item) =>
      item.id === day.lodging.slug ||
      ("detailSlug" in item && item.detailSlug === day.lodging.slug),
  );
  if (!lodgingAlreadyOnTimeline && day.lodging.kind !== "plane") {
    ids.push(day.lodging.slug);
  }
  return ids;
}

export function buildTripRegistry(
  modules: readonly DayModule[],
  overview: JourneyView,
): TripRegistry {
  const byDay = new Map<number, DayModule>();
  const errors: string[] = [];

  for (const dayModule of modules) {
    const { day, beats } = dayModule;
    if (byDay.has(day.id)) errors.push(`duplicate day id ${day.id}`);
    byDay.set(day.id, dayModule);

    const rendered = renderedBeatIds(day);
    const expected = new Set(rendered);
    if (expected.size !== rendered.length) {
      errors.push(`day ${day.id} renders a duplicate beat id`);
    }
    for (const beatId of expected) {
      if (!beats[beatId]) errors.push(`day ${day.id} is missing beat "${beatId}"`);
    }
    for (const [beatId, beat] of Object.entries(beats)) {
      if (!expected.has(beatId)) {
        errors.push(`day ${day.id} defines orphan beat "${beatId}"`);
      }
      if (!(beat.space > 0) || !Number.isFinite(beat.space)) {
        errors.push(`day ${day.id} beat "${beatId}" has invalid space`);
      }
      if (beat.handoff !== undefined && !(beat.handoff > 0 && beat.handoff < 1)) {
        errors.push(`day ${day.id} beat "${beatId}" has invalid handoff`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid trip registry:\n- ${errors.join("\n- ")}`);
  }

  return {
    modules,
    days: modules.map((dayModule) => dayModule.day),
    overview,
    day: (dayId) => byDay.get(dayId),
    beat: (dayId, beatId) => byDay.get(dayId)?.beats[beatId],
  };
}
