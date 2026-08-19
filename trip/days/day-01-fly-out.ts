import type { DayModule } from "@/lib/engine/types";
import { flightOutView, usaDepartView } from "../flight-cameras";

export const day1: DayModule = {
  day: {
    id: 1,
    isoDate: "2026-09-05",
    weekday: "Saturday",
    monthDay: "Sept 5",
    stripLabel: "Fly",
    title: "Fly out",
    summary: "Kansas City to Munich · sleep on the plane",
    timeline: [
      {
        kind: "event",
        id: "depart-mci",
        emoji: "🛫",
        time: "1:45 PM",
        title: "Depart Kansas City (MCI)",
        detailSlug: "flight-mci-muc",
      },
      {
        kind: "transport",
        id: "flight-out",
        mode: "flight",
        label: "MCI → Munich",
        meta: "12+ hr overnight flight",
        detailSlug: "flight-mci-muc",
      },
    ],
    lodging: {
      slug: "the-plane",
      name: "The plane",
      context: "Overnight in the air. The first night is the crossing.",
      kind: "plane",
    },
    practical: [
      { text: "Long overnight. Arrive Munich the next morning around 10:00." },
    ],
  },
  enterView: usaDepartView(),
  beats: {
    "depart-mci": { space: 72, view: () => usaDepartView() },
    "flight-out": { space: 200, handoff: 0.7, view: flightOutView },
  },
};
