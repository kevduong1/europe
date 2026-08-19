import { along, clamp, lerp, lerpBearing, lerpLngLat, smoothstep } from "@/lib/engine/geo";
import type { JourneyView } from "@/lib/engine/types";
import {
  FIRENZE,
  HOFBRAUHAUS,
  QC_TERME,
  RESCIESA,
  SECEDA_RIDGE_END,
  walkWombatHbf,
  WOMBAT,
} from "./geometry/legs";
import { CITY, cityHold, pose, T } from "./cameras";
import { CLUSTERS } from "./clusters";

const WOMBAT_CLOSE_ZOOM = 15.08;
const WOMBAT_CLOSE_PITCH = 32;

/** Day 2/3 hostel arrival and Day 4 departure share this exact bearing. */
export const WOMBAT_ORBIT_END = 86;
/** Day 3's garden exit is Day 3's Hofbräuhaus entrance heading. */
export const GARDEN_ORBIT_END = 18;
/** Day 3's final orbit is the bearing used to return to Wombat that night. */
export const HOFBRAUHAUS_ORBIT_END = CITY.hofbrauhaus.bearing + 32;

export function wombatClose(
  dayId: number,
  label: string,
  extras: { bearing?: number; pitch?: number; zoom?: number } = {},
): JourneyView {
  return pose({
    phase: "day",
    center: WOMBAT,
    zoom: extras.zoom ?? WOMBAT_CLOSE_ZOOM,
    pitch: extras.pitch ?? WOMBAT_CLOSE_PITCH,
    bearing: extras.bearing ?? WOMBAT_ORBIT_END,
    showFlight: false,
    flightT: 0,
    flightLeg: null,
    trailT: 0,
    dayId,
    label,
    here: WOMBAT,
    focusStopId: "wombat",
    expandedClusterIds: CLUSTERS.munich,
    visitedClusterIds: CLUSTERS.none,
  });
}

export function wombatMoment(
  dayId: number,
  label: string,
  progress: number,
  arriving = false,
): JourneyView {
  const u = clamp(progress);
  if (arriving) {
    const walkT = smoothstep(clamp(u / 0.22));
    const settle = smoothstep(clamp((u - 0.14) / 0.5));
    const here = walkT >= 0.999 ? WOMBAT : along(walkWombatHbf, 1 - walkT);
    return pose({
      phase: "day",
      center: lerpLngLat(CITY.munich.center, WOMBAT, lerp(0.16, 1, settle)),
      zoom: lerp(CITY.munich.zoom + 0.18, WOMBAT_CLOSE_ZOOM, settle),
      pitch: lerp(CITY.munich.pitch, WOMBAT_CLOSE_PITCH, settle),
      bearing: lerpBearing(
        CITY.munich.bearing,
        lerp(16, WOMBAT_ORBIT_END, smoothstep(u)),
        settle,
      ),
      showFlight: false,
      flightT: 0,
      flightLeg: null,
      trailT: 0,
      dayId,
      label,
      here,
      focusStopId: settle > 0.16 ? "wombat" : null,
      localRouteId: "hbf-wombat",
      localRouteT: walkT,
      expandedClusterIds: CLUSTERS.munich,
      visitedClusterIds: CLUSTERS.none,
    });
  }

  const fromHofbrau = dayId >= 3;
  const settle = smoothstep(clamp(u / (fromHofbrau ? 0.48 : 0.22)));
  const start = fromHofbrau
    ? CITY.hofbrauhaus
    : {
        center: WOMBAT,
        zoom: WOMBAT_CLOSE_ZOOM,
        pitch: WOMBAT_CLOSE_PITCH,
        bearing: WOMBAT_ORBIT_END,
      };
  return pose({
    phase: "day",
    center: lerpLngLat(start.center, WOMBAT, fromHofbrau ? settle : 1),
    zoom: lerp(start.zoom, WOMBAT_CLOSE_ZOOM, fromHofbrau ? settle : 1),
    pitch: lerp(start.pitch, WOMBAT_CLOSE_PITCH, fromHofbrau ? settle : 1),
    bearing: fromHofbrau
      ? lerpBearing(HOFBRAUHAUS_ORBIT_END, WOMBAT_ORBIT_END, settle)
      : WOMBAT_ORBIT_END,
    showFlight: false,
    flightT: 0,
    flightLeg: null,
    trailT: 0,
    dayId,
    label,
    here: lerpLngLat(fromHofbrau ? HOFBRAUHAUS : WOMBAT, WOMBAT, settle),
    focusStopId: !fromHofbrau || settle > 0.22 ? "wombat" : "hofbrauhaus",
    expandedClusterIds: CLUSTERS.munich,
    visitedClusterIds: CLUSTERS.none,
  });
}

export function resciesaHold(dayId = 5): JourneyView {
  return cityHold(CITY.resciesa, {
    dayId,
    label: "Rifugio Resciesa",
    trailT: T.resciesa,
    here: RESCIESA,
    focusStopId: "resciesa",
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

export function firenzeHold(dayId = 6): JourneyView {
  return cityHold(CITY.firenze, {
    dayId,
    label: "Rifugio Firenze",
    trailT: T.firenze,
    here: FIRENZE,
    focusStopId: "firenze",
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

export function secedaHold(): JourneyView {
  return cityHold(CITY.seceda, {
    dayId: 7,
    label: "Seceda — the Odle ridge",
    trailT: T.seceda,
    here: SECEDA_RIDGE_END,
    focusStopId: "seceda",
    focus: SECEDA_RIDGE_END,
    amount: 0.3,
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

export function qcTermeHold(dayId = 7): JourneyView {
  return cityHold(CITY.qcTerme, {
    dayId,
    label: "QC Terme Dolomiti",
    trailT: T.qcTerme,
    here: QC_TERME,
    focusStopId: "val-di-fassa-tbd",
    focus: QC_TERME,
    amount: 0.3,
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}
