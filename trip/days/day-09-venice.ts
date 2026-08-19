import type { DayModule } from "@/lib/engine/types";
import { VENICE } from "../geometry/legs";
import { CITY, cityHold, T } from "../cameras";
import { CLUSTERS } from "../clusters";

function veniceDayView() {
  return cityHold(CITY.venice, {
    dayId: 9,
    label: "Day 9 · Venice",
    trailT: T.venice,
    here: VENICE,
    focusStopId: "venice-tbd",
    expandedClusterIds: CLUSTERS.venice,
    visitedClusterIds: CLUSTERS.pastDolomites,
  });
}

export const day9: DayModule = {
  day: {
    id: 9,
    isoDate: "2026-09-13",
    weekday: "Sunday",
    monthDay: "Sept 13",
    stripLabel: "Venice",
    title: "Venice",
    summary: "Open day in the city · lodging still to be decided",
    timeline: [
      {
        kind: "open",
        id: "open-venice",
        text: "Nothing planned yet — the day is open.",
      },
    ],
    lodging: {
      slug: "venice-lodging",
      name: "Venice lodging to be decided",
      context: "The night slot is still a TODO.",
      kind: "tbd",
      todo: "Book Venice lodging",
    },
    practical: [{ text: "Book Venice lodging.", todo: true }],
  },
  enterView: veniceDayView(),
  beats: {
    "open-venice": { space: 80, view: veniceDayView },
    "venice-lodging": { space: 60, view: veniceDayView },
  },
};
