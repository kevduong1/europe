import { rideLine } from "@/lib/engine/camera";
import type { DayModule } from "@/lib/engine/types";
import {
  BOLZANO,
  busFassaBolzano,
  QC_TERME,
  railBolzanoVenice,
  VENICE,
} from "../geometry/legs";
import { CITY, cityHold, pose, T } from "../cameras";
import { CLUSTERS } from "../clusters";
import { qcTermeHold } from "../scenes";

export const day8: DayModule = {
  day: {
    id: 8,
    isoDate: "2026-09-12",
    weekday: "Saturday",
    monthDay: "Sept 12",
    stripLabel: "To Venice",
    title: "Out of the mountains",
    summary: "Bus to Bolzano, train to Venice",
    timeline: [
      {
        kind: "transport",
        id: "bus-fassa-bolzano",
        mode: "bus",
        label: "Val di Fassa → Bolzano",
        meta: "40.9 km over Passo Costalunga",
        detailSlug: "bus-fassa-bolzano",
      },
      {
        kind: "transport",
        id: "train-bolzano-venice",
        mode: "rail",
        label: "Bolzano → Venezia Santa Lucia",
        meta: "~4 hr via Verona · Eurail",
        detailSlug: "train-bolzano-venice",
      },
    ],
    lodging: {
      slug: "venice-first-night",
      name: "Lodging to be decided",
      context: "First night in Venice — the booking is still open.",
      kind: "tbd",
      todo: "Book Venice lodging for the night of the 12th.",
    },
    practical: [
      { text: "Eurail day, back on the rails after Bolzano." },
      { text: "Book Venice lodging for the night of the 12th.", todo: true },
    ],
  },
  enterView: cityHold(CITY.qcTerme, {
    dayId: 8,
    label: "Day 8 · To Venice",
    trailT: T.qcTerme,
    here: QC_TERME,
    focusStopId: "val-di-fassa-tbd",
    amount: 0.2,
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  }),
  beats: {
    "bus-fassa-bolzano": {
      space: 90,
      view: (progress) =>
        rideLine(
          qcTermeHold(),
          pose({
            phase: "day",
            ...CITY.fassaBolzano,
            showFlight: false,
            flightT: 0,
            flightLeg: null,
            trailT: T.qcTerme,
            dayId: 8,
            label: "Val di Fassa → Bolzano",
            here: QC_TERME,
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          cityHold(CITY.fassaBolzano, {
            dayId: 8,
            label: "Bolzano",
            trailT: T.bolzanoOut,
            here: BOLZANO,
            focusStopId: "bolzano",
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          busFassaBolzano,
          T.qcTerme,
          T.bolzanoOut,
          progress,
        ),
    },
    "train-bolzano-venice": {
      space: 200,
      view: (progress) =>
        rideLine(
          cityHold(CITY.fassaBolzano, {
            dayId: 8,
            label: "Bolzano → Venezia Santa Lucia",
            trailT: T.bolzanoOut,
            here: BOLZANO,
            focusStopId: "bolzano",
            expandedClusterIds: CLUSTERS.dolomites,
            visitedClusterIds: CLUSTERS.pastInnsbruck,
          }),
          pose({
            phase: "day",
            ...CITY.toVenice,
            showFlight: false,
            flightT: 0,
            flightLeg: null,
            trailT: T.bolzanoOut,
            dayId: 8,
            label: "Bolzano → Venezia Santa Lucia",
            here: BOLZANO,
            expandedClusterIds: CLUSTERS.none,
            visitedClusterIds: CLUSTERS.pastDolomites,
          }),
          cityHold(CITY.venice, {
            dayId: 8,
            label: "Venezia Santa Lucia",
            trailT: T.venice,
            here: VENICE,
            focusStopId: "venice-tbd",
            expandedClusterIds: CLUSTERS.venice,
            visitedClusterIds: CLUSTERS.pastDolomites,
          }),
          railBolzanoVenice,
          T.bolzanoOut,
          T.venice,
          progress,
        ),
    },
    "venice-first-night": {
      space: 64,
      view: () =>
        cityHold(CITY.venice, {
          dayId: 8,
          label: "First night in Venice",
          trailT: T.venice,
          here: VENICE,
          focusStopId: "venice-tbd",
          expandedClusterIds: CLUSTERS.venice,
          visitedClusterIds: CLUSTERS.pastDolomites,
        }),
    },
  },
};
