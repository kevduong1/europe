import { mix, rideLine } from "@/lib/engine/camera";
import { along, clamp } from "@/lib/engine/geo";
import type { DayModule } from "@/lib/engine/types";
import {
  INNSBRUCK_HBF,
  MONTAGU,
  MUNICH_HBF,
  railMunichInnsbruck,
  walkWombatHbf,
  WOMBAT,
} from "../geometry/legs";
import { CITY, cityHold, munichStay, pose, T } from "../cameras";
import { CLUSTERS } from "../clusters";
import { WOMBAT_ORBIT_END, wombatClose } from "../scenes";

export const day4: DayModule = {
  day: {
    id: 4,
    isoDate: "2026-09-08",
    weekday: "Tuesday",
    monthDay: "Sept 8",
    stripLabel: "Innsbruck",
    title: "Munich → Innsbruck",
    summary: "Eurail day · sleep at Montagu Hostel",
    timeline: [
      {
        kind: "event",
        id: "leave-wombat",
        title: "Leave The Wombat Hostel",
        note: "Bags packed · the station is a short walk.",
        detailSlug: "wombat-hostel",
      },
      {
        kind: "transport",
        id: "walk-hbf",
        mode: "trail",
        label: "Walk to München Hbf",
        meta: "A few minutes from the door",
      },
      {
        kind: "transport",
        id: "train-munich-innsbruck",
        mode: "rail",
        label: "Munich Hbf → Innsbruck",
        meta: "~1h50 · Eurail",
        detailSlug: "train-munich-innsbruck",
      },
      {
        kind: "event",
        id: "check-in-montagu",
        title: "Check in at Montagu Hostel",
        note: "~€30/night pp",
        detailSlug: "montagu-hostel",
      },
    ],
    lodging: {
      slug: "montagu-hostel",
      name: "Montagu Hostel",
      context: "~€30/night pp. Book 1–2 months out.",
      kind: "hostel",
      todo: "Book 1–2 months out",
    },
    practical: [
      { text: "Eurail day." },
      { text: "Book Montagu Hostel 1–2 months out.", todo: true },
    ],
  },
  enterView: munichStay(4, "Day 4 · Innsbruck"),
  beats: {
    "leave-wombat": {
      space: 116,
      view: (progress) => {
        const u = clamp((progress - 0.18) / 0.62);
        return mix(
          wombatClose(4, "Leave Wombat", { bearing: WOMBAT_ORBIT_END }),
          munichStay(4, "Walk to München Hbf", {
            here: WOMBAT,
            focusStopId: u < 0.35 ? "wombat" : null,
          }),
          u,
        );
      },
    },
    "walk-hbf": {
      space: 88,
      view: (progress) => {
        const u = clamp((progress - 0.12) / 0.7);
        const here = along(walkWombatHbf, u);
        return {
          ...munichStay(4, "Walk to Hbf", {
            here,
            focusStopId: "wombat",
            focus: here,
            amount: 0.38,
          }),
          localRouteId: "wombat-hbf",
          localRouteT: u,
        };
      },
    },
    "train-munich-innsbruck": {
      space: 240,
      view: (progress) =>
        rideLine(
          munichStay(4, "München Hbf", {
            here: MUNICH_HBF,
            focusStopId: "wombat",
            amount: 0.16,
          }),
          pose({
            phase: "day",
            ...CITY.munichInnsbruck,
            showFlight: false,
            flightT: 0,
            flightLeg: null,
            trailT: T.hbf,
            dayId: 4,
            label: "Munich → Innsbruck",
            here: MUNICH_HBF,
            expandedClusterIds: CLUSTERS.none,
            visitedClusterIds: CLUSTERS.munich,
          }),
          cityHold(CITY.innsbruck, {
            dayId: 4,
            label: "Innsbruck",
            trailT: T.innsbruck,
            here: INNSBRUCK_HBF,
            expandedClusterIds: CLUSTERS.innsbruck,
            visitedClusterIds: CLUSTERS.munich,
          }),
          railMunichInnsbruck,
          T.hbf,
          T.innsbruck,
          progress,
        ),
    },
    "check-in-montagu": {
      space: 84,
      view: () =>
        cityHold(CITY.innsbruck, {
          dayId: 4,
          label: "Montagu Hostel",
          trailT: T.montagu,
          here: MONTAGU,
          focusStopId: "montagu",
          focus: MONTAGU,
          amount: 0.32,
          expandedClusterIds: CLUSTERS.innsbruck,
          visitedClusterIds: CLUSTERS.munich,
        }),
    },
  },
};
