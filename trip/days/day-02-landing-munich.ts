import { mix } from "@/lib/engine/camera";
import { along, clamp, smoothstep } from "@/lib/engine/geo";
import type { DayModule } from "@/lib/engine/types";
import { MUNICH_HBF, railMucHbf } from "../geometry/legs";
import { munichStay } from "../cameras";
import { mucArrival } from "../flight-cameras";
import { wombatMoment } from "../scenes";

export const day2: DayModule = {
  day: {
    id: 2,
    isoDate: "2026-09-06",
    weekday: "Sunday",
    monthDay: "Sept 6",
    stripLabel: "Munich",
    title: "Landing in Munich",
    summary: "Airport train into the city · sleep at The Wombat Hostel",
    timeline: [
      {
        kind: "event",
        id: "arrive-muc",
        time: "10:00",
        title: "Arrive Munich (MUC)",
        detailSlug: "flight-mci-muc",
      },
      {
        kind: "transport",
        id: "airport-train",
        mode: "rail",
        label: "Airport train → München Hbf",
        meta: "Tickets at the airport",
        detailSlug: "airport-train",
      },
      {
        kind: "event",
        id: "check-in-wombat",
        title: "Check in at The Wombat Hostel",
        note: "~€30/night pp",
        detailSlug: "wombat-hostel",
      },
    ],
    lodging: {
      slug: "wombat-hostel",
      name: "The Wombat Hostel",
      context: "~€30/night pp, near the Hauptbahnhof.",
      kind: "hostel",
      todo: "Book 1–2 months out",
    },
    practical: [
      { text: "Book The Wombat Hostel 1–2 months out.", todo: true },
      { text: "Airport train tickets at the airport." },
    ],
  },
  enterView: mucArrival(0),
  beats: {
    "arrive-muc": { space: 122, view: mucArrival },
    "airport-train": {
      space: 165,
      view: (progress) => {
        const u = smoothstep(clamp(progress));
        const from = mucArrival(1);
        const to = munichStay(2, "München Hbf", {
          here: MUNICH_HBF,
          focusStopId: "wombat",
          amount: 0.18,
        });
        return {
          ...mix(from, to, u),
          here: along(railMucHbf, u),
          phase: "day",
          showFlight: false,
          flightLeg: null,
          label: "Airport train → Hbf",
          localRouteId: "airport-transfer",
          localRouteT: u,
        };
      },
    },
    "check-in-wombat": {
      space: 210,
      view: (progress) => wombatMoment(2, "The Wombat Hostel", progress, true),
    },
  },
};
