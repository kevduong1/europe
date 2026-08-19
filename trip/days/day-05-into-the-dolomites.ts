import { hikeLine, rideLine } from "@/lib/engine/camera";
import type { DayModule } from "@/lib/engine/types";
import {
  BOLZANO,
  busBolzanoOrtisei,
  INNSBRUCK_HBF,
  MONTAGU,
  ORTISEI,
  railInnsbruckBolzano,
  RESCIESA,
  trailOrtiseiResciesa,
} from "../geometry/legs";
import { CITY, cityHold, pose, T } from "../cameras";
import { CLUSTERS } from "../clusters";
import { resciesaHold } from "../scenes";

export const day5: DayModule = {
  day: {
    id: 5,
    isoDate: "2026-09-09",
    weekday: "Wednesday",
    monthDay: "Sept 9",
    stripLabel: "Ortisei",
    title: "Into the Dolomites",
    summary: "Train, then bus, then the trail · sleep at Rifugio Resciesa",
    timeline: [
      {
        kind: "transport",
        id: "train-innsbruck-bolzano",
        mode: "rail",
        label: "Innsbruck → Bolzano",
        meta: "Morning · Eurail",
        detailSlug: "train-innsbruck-bolzano",
      },
      {
        kind: "transport",
        id: "bus-bolzano-ortisei",
        mode: "bus",
        label: "Bolzano → Ortisei",
        meta: "35.9 km on the SS12 and SS242",
        detailSlug: "bus-bolzano-ortisei",
      },
      {
        kind: "transport",
        id: "onto-the-trail",
        mode: "trail",
        label: "Ortisei → Rifugio Resciesa",
        meta: "Rail ends · trail begins",
        detailSlug: "rifugio-resciesa",
      },
    ],
    lodging: {
      slug: "rifugio-resciesa",
      name: "Rifugio Resciesa",
      context: "First hut night, above Ortisei.",
      kind: "hut",
    },
    practical: [
      { text: "Eurail day, then bus into Val Gardena." },
      {
        text: "Pack light for the hut traverse — bags stay minimal for 3 days.",
        todo: true,
      },
    ],
  },
  enterView: cityHold(CITY.innsbruck, {
    dayId: 5,
    label: "Day 5 · Ortisei",
    trailT: T.montagu,
    here: MONTAGU,
    focusStopId: "montagu",
    expandedClusterIds: CLUSTERS.innsbruck,
    visitedClusterIds: CLUSTERS.munich,
  }),
  beats: {
    "train-innsbruck-bolzano": {
      space: 190,
      view: (progress) =>
        rideLine(
          cityHold(CITY.innsbruck, {
            dayId: 5,
            label: "Innsbruck → Bolzano",
            trailT: T.montagu,
            here: INNSBRUCK_HBF,
            focusStopId: "montagu",
            expandedClusterIds: CLUSTERS.innsbruck,
            visitedClusterIds: CLUSTERS.munich,
          }),
          pose({
            phase: "day",
            ...CITY.innsbruckBolzano,
            showFlight: false,
            flightT: 0,
            flightLeg: null,
            trailT: T.innsbruck,
            dayId: 5,
            label: "Innsbruck → Bolzano",
            here: INNSBRUCK_HBF,
            expandedClusterIds: CLUSTERS.none,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          cityHold(CITY.bolzanoOrtisei, {
            dayId: 5,
            label: "Bolzano",
            trailT: T.bolzano,
            here: BOLZANO,
            focusStopId: "bolzano",
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          railInnsbruckBolzano,
          T.innsbruck,
          T.bolzano,
          progress,
        ),
    },
    "bus-bolzano-ortisei": {
      space: 120,
      view: (progress) =>
        rideLine(
          cityHold(CITY.bolzanoOrtisei, {
            dayId: 5,
            label: "Bolzano → Ortisei",
            trailT: T.bolzano,
            here: BOLZANO,
            focusStopId: "bolzano",
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          cityHold(CITY.bolzanoOrtisei, {
            dayId: 5,
            label: "Bolzano → Ortisei",
            trailT: T.ortisei,
            here: ORTISEI,
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          cityHold(CITY.dolomites, {
            dayId: 5,
            label: "Ortisei",
            trailT: T.ortisei,
            here: ORTISEI,
            focusStopId: "ortisei",
            focus: ORTISEI,
            amount: 0.18,
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          busBolzanoOrtisei,
          T.bolzano,
          T.ortisei,
          progress,
        ),
    },
    "onto-the-trail": {
      space: 140,
      view: (progress) =>
        hikeLine(
          cityHold(CITY.dolomites, {
            dayId: 5,
            label: "Ortisei → Resciesa",
            trailT: T.ortisei,
            here: ORTISEI,
            focusStopId: "ortisei",
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          cityHold(CITY.dolomites, {
            dayId: 5,
            label: "Ortisei → Resciesa",
            trailT: T.resciesa,
            here: RESCIESA,
            focus: RESCIESA,
            amount: 0.24,
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          resciesaHold(),
          trailOrtiseiResciesa,
          T.ortisei,
          T.resciesa,
          progress,
        ),
    },
  },
};
