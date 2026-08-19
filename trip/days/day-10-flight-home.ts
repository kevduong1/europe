import type { DayModule } from "@/lib/engine/types";
import { VCE } from "../geometry/legs";
import { CITY, cityHold } from "../cameras";
import { flightHomeView } from "../flight-cameras";
import { CLUSTERS } from "../clusters";

export const day10: DayModule = {
  day: {
    id: 10,
    isoDate: "2026-09-14",
    weekday: "Monday",
    monthDay: "Sept 14",
    stripLabel: "Home",
    title: "Home",
    summary: "Venice to Kansas City · the line, fully traveled",
    timeline: [
      {
        kind: "transport",
        id: "flight-home",
        mode: "flight",
        label: "Venice → MCI",
        meta: "Homeward",
        detailSlug: "flight-vce-mci",
      },
    ],
    lodging: {
      slug: "flight-home",
      name: "Homeward",
      context: "The trip ends in the air, the same way it began.",
      kind: "plane",
    },
    practical: [
      { text: "Fly Venice → MCI. Confirmation details still to be added." },
    ],
  },
  enterView: cityHold(CITY.venice, {
    dayId: 10,
    label: "Day 10 · Home",
    trailT: 1,
    here: VCE,
    focusStopId: "vce",
    focus: VCE,
    amount: 0.22,
    expandedClusterIds: CLUSTERS.venice,
    visitedClusterIds: CLUSTERS.pastDolomites,
  }),
  beats: {
    "flight-home": { space: 200, view: flightHomeView },
  },
};
