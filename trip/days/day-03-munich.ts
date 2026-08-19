import { rideLine } from "@/lib/engine/camera";
import { along, clamp, lerp, lerpBearing, lerpLngLat, smoothstep } from "@/lib/engine/geo";
import type { DayModule } from "@/lib/engine/types";
import {
  EISBACHWELLE,
  HOFBRAUHAUS,
  KLEINHESSELOHER_SEE,
  walkEnglischerGarten,
  walkGardenHofbrauhaus,
} from "../geometry/legs";
import { CITY, munichStay, pose } from "../cameras";
import { CLUSTERS } from "../clusters";
import {
  GARDEN_ORBIT_END,
  HOFBRAUHAUS_ORBIT_END,
  wombatMoment,
} from "../scenes";

export const day3: DayModule = {
  day: {
    id: 3,
    isoDate: "2026-09-07",
    weekday: "Monday",
    monthDay: "Sept 7",
    stripLabel: "Munich",
    title: "Munich",
    summary: "Open day in the city · sleep at The Wombat Hostel",
    timeline: [
      {
        kind: "open",
        id: "open-munich",
        text: "Keep the morning loose; the walk below is a suggested line, not a fixed schedule.",
      },
      {
        kind: "event",
        id: "english-garden",
        title: "Walk up the Englischer Garten",
        note: "2.2 km on park paths: Eisbachwelle → Monopteros skyline view → Chinese Tower beer garden → Kleinhesseloher See.",
        detailSlug: "english-garden",
      },
      {
        kind: "event",
        id: "hofbrauhaus",
        title: "Hofbräuhaus am Platzl",
        note: "Founded in 1589 and open to the public since 1828. Try the ground-floor Schwemme: communal tables, free seating, and live tavern music.",
        detailSlug: "hofbrauhaus",
      },
    ],
    lodging: {
      slug: "wombat-hostel",
      name: "The Wombat Hostel",
      context: "Second night in Munich.",
      kind: "hostel",
    },
    practical: [],
  },
  enterView: munichStay(3, "Day 3 · Munich"),
  beats: {
    "open-munich": { space: 80, view: () => munichStay(3, "Day 3 · Munich") },
    "english-garden": {
      space: 150,
      view: (progress) => {
        const view = rideLine(
          munichStay(3, "Eisbachwelle", {
            here: EISBACHWELLE,
            focusStopId: "eisbachwelle",
            focus: EISBACHWELLE,
            amount: 0.4,
          }),
          pose({
            phase: "day",
            center: CITY.englishGarden.center,
            zoom: CITY.englishGarden.zoom,
            pitch: CITY.englishGarden.pitch,
            bearing: CITY.englishGarden.bearing,
            showFlight: false,
            flightT: 0,
            flightLeg: null,
            trailT: 0,
            dayId: 3,
            label: "Walking the Englischer Garten",
            here: EISBACHWELLE,
            focusStopId: "english-garden",
            expandedClusterIds: CLUSTERS.munich,
            visitedClusterIds: CLUSTERS.none,
          }),
          munichStay(3, "Kleinhesseloher See", {
            here: KLEINHESSELOHER_SEE,
            focus: KLEINHESSELOHER_SEE,
            amount: 0.3,
          }),
          walkEnglischerGarten,
          0,
          0,
          progress,
        );
        return {
          ...view,
          bearing: lerpBearing(view.bearing, GARDEN_ORBIT_END, smoothstep(clamp(progress))),
          focusStopId: "english-garden",
          localRouteId: "english-garden",
          localRouteT: smoothstep(clamp((progress - 0.06) / 0.8)),
        };
      },
    },
    hofbrauhaus: {
      space: 190,
      handoff: 0.9,
      view: (progress) => {
        const routeT = smoothstep(clamp(progress / 0.22));
        const zoomT = smoothstep(clamp((progress - 0.08) / 0.5));
        const orbitT = smoothstep(clamp((progress - 0.16) / 0.78));
        return pose({
          phase: "day",
          center: lerpLngLat(CITY.munich.center, CITY.hofbrauhaus.center, zoomT),
          zoom: lerp(CITY.munich.zoom, CITY.hofbrauhaus.zoom, zoomT),
          pitch: lerp(CITY.munich.pitch, CITY.hofbrauhaus.pitch, zoomT),
          bearing: lerpBearing(
            GARDEN_ORBIT_END,
            lerp(CITY.hofbrauhaus.bearing, HOFBRAUHAUS_ORBIT_END, orbitT),
            zoomT,
          ),
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: 0,
          dayId: 3,
          label: "Hofbräuhaus am Platzl",
          here: routeT >= 0.999 ? HOFBRAUHAUS : along(walkGardenHofbrauhaus, routeT),
          focusStopId: zoomT > 0.18 ? "hofbrauhaus" : null,
          localRouteId: "garden-hofbrauhaus",
          localRouteT: routeT,
          expandedClusterIds: CLUSTERS.munich,
          visitedClusterIds: CLUSTERS.none,
        });
      },
    },
    "wombat-hostel": {
      space: 170,
      view: (progress) => wombatMoment(3, "The Wombat Hostel", progress),
    },
  },
};
