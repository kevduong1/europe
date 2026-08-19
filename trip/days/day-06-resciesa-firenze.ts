import { hikeLine } from "@/lib/engine/camera";
import type { DayModule } from "@/lib/engine/types";
import { FIRENZE, RESCIESA, trailResciesaFirenze } from "../geometry/legs";
import { CITY, cityHold, T } from "../cameras";
import { CLUSTERS } from "../clusters";
import { firenzeHold } from "../scenes";

export const day6: DayModule = {
  day: {
    id: 6,
    isoDate: "2026-09-10",
    weekday: "Thursday",
    monthDay: "Sept 10",
    stripLabel: "Firenze",
    title: "Resciesa to Rifugio Firenze",
    summary: "Hike across the Odle group · sleep at Rifugio Firenze",
    timeline: [
      {
        kind: "transport",
        id: "hike-resciesa-firenze",
        mode: "trail",
        label: "Resciesa → Rifugio Firenze",
        meta: "Deeper into the Dolomites",
        detailSlug: "rifugio-firenze",
      },
    ],
    lodging: {
      slug: "rifugio-firenze",
      name: "Rifugio Firenze",
      context: "Second hut night, under the Odle.",
      kind: "hut",
    },
    practical: [],
  },
  enterView: cityHold(CITY.resciesa, {
    dayId: 6,
    label: "Day 6 · Firenze",
    trailT: T.resciesa,
    here: RESCIESA,
    focusStopId: "resciesa",
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  }),
  beats: {
    "hike-resciesa-firenze": {
      space: 160,
      view: (progress) =>
        hikeLine(
          cityHold(CITY.dolomites, {
            dayId: 6,
            label: "Resciesa → Firenze",
            trailT: T.resciesa,
            here: RESCIESA,
            focusStopId: "resciesa",
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          cityHold(CITY.dolomites, {
            dayId: 6,
            label: "Resciesa → Firenze",
            trailT: T.firenze,
            here: FIRENZE,
            focus: FIRENZE,
            amount: 0.22,
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          firenzeHold(),
          trailResciesaFirenze,
          T.resciesa,
          T.firenze,
          progress,
        ),
    },
  },
};
