import {
  BOLZANO,
  busBolzanoOrtisei,
  EISBACHWELLE,
  FIRENZE,
  flightHome,
  INNSBRUCK_HBF,
  MONTAGU,
  MUC,
  MUNICH_HBF,
  orangeTrail,
  ORTISEI,
  PUEZ,
  railInnsbruckBolzano,
  railMucHbf,
  railMunichInnsbruck,
  RESCIESA,
  stopClusters,
  trailFirenzePuez,
  trailOrtiseiResciesa,
  trailResciesaFirenze,
  VCE,
  VENICE,
  walkWombatHbf,
  WOMBAT,
} from "@/data/route";
import { days, journeyFrame } from "@/data/trip";
import {
  along,
  clamp,
  lerp,
  lerpBearing,
  lerpLngLat,
  nearestT,
  smoothstep,
  type LngLat,
} from "@/lib/geo";

export type JourneyPhase = "overview" | "mci" | "flight" | "day";
export type FlightLeg = "out" | "home" | null;

export type JourneyView = {
  phase: JourneyPhase;
  bounds: [number, number, number, number];
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
  showFlight: boolean;
  flightT: number;
  flightLeg: FlightLeg;
  trailT: number;
  voxelOpacity: number;
  climbM: number;
  jump: boolean;
  dayId: number | null;
  label: string;
  expandedClusterIds: string[];
  visitedClusterIds: string[];
  here: LngLat | null;
  focusStopId: string | null;
};

const FREEZE = 0.52;
const HOLD = 0.74;

const T = {
  hbf: nearestT(orangeTrail, MUNICH_HBF),
  innsbruck: nearestT(orangeTrail, INNSBRUCK_HBF),
  montagu: nearestT(orangeTrail, MONTAGU),
  bolzano: nearestT(orangeTrail, BOLZANO),
  ortisei: nearestT(orangeTrail, ORTISEI),
  resciesa: nearestT(orangeTrail, RESCIESA),
  firenze: nearestT(orangeTrail, FIRENZE),
  puez: nearestT(orangeTrail, PUEZ),
  venice: nearestT(orangeTrail, VENICE),
};

type CityCam = {
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
};

const CITY = {
  munich: {
    center: [11.575, 48.145] as LngLat,
    zoom: 11.38,
    pitch: 0,
    bearing: 0,
  },
  munichAirport: {
    center: [11.66, 48.24] as LngLat,
    zoom: 10.52,
    pitch: 0,
    bearing: 0,
  },
  innsbruck: {
    center: [11.404, 47.268] as LngLat,
    zoom: 12.02,
    pitch: 0,
    bearing: 0,
  },
  venice: {
    center: [12.335, 45.438] as LngLat,
    zoom: 12.22,
    pitch: 0,
    bearing: 0,
  },
  dolomites: {
    center: [11.74, 46.592] as LngLat,
    zoom: 12.02,
    pitch: 38,
    bearing: 16,
  },
  munichInnsbruck: {
    center: [11.82, 47.7] as LngLat,
    zoom: 7.82,
    pitch: 0,
    bearing: 6,
  },
  innsbruckBolzano: {
    center: [11.48, 46.88] as LngLat,
    zoom: 8.12,
    pitch: 0,
    bearing: 8,
  },
  bolzanoOrtisei: {
    center: [11.52, 46.54] as LngLat,
    zoom: 10.35,
    pitch: 8,
    bearing: 12,
  },
};

function clusterState(dayId: number | null) {
  if (dayId == null) {
    return { expandedClusterIds: [] as string[], visitedClusterIds: [] as string[] };
  }
  const expandedClusterIds: string[] = [];
  const visitedClusterIds: string[] = [];
  for (const cluster of stopClusters) {
    const lo = Math.min(...cluster.expandOnDays);
    const hi = Math.max(...cluster.expandOnDays);
    if (dayId >= lo && dayId <= hi) expandedClusterIds.push(cluster.id);
    else if (dayId > hi) visitedClusterIds.push(cluster.id);
  }
  return { expandedClusterIds, visitedClusterIds };
}

function pose(
  partial: Partial<JourneyView> &
    Pick<
      JourneyView,
      | "phase"
      | "center"
      | "zoom"
      | "pitch"
      | "bearing"
      | "showFlight"
      | "flightT"
      | "flightLeg"
      | "trailT"
      | "dayId"
      | "label"
    >,
): JourneyView {
  const clusters = clusterState(partial.dayId ?? null);
  const {
    expandedClusterIds,
    visitedClusterIds,
    here,
    focusStopId,
    ...rest
  } = partial;
  return {
    bounds: journeyFrame.bounds,
    jump: false,
    voxelOpacity: 0,
    climbM: 1200,
    ...rest,
    expandedClusterIds: expandedClusterIds ?? clusters.expandedClusterIds,
    visitedClusterIds: visitedClusterIds ?? clusters.visitedClusterIds,
    here: here ?? null,
    focusStopId: focusStopId ?? null,
  };
}

function cityHold(
  cam: CityCam,
  opts: {
    dayId: number;
    label: string;
    trailT: number;
    here?: LngLat | null;
    focusStopId?: string | null;
    focus?: LngLat;
    amount?: number;
    expandedClusterIds?: string[];
    visitedClusterIds?: string[];
    voxel?: number;
    climb?: number;
  },
): JourneyView {
  const amount = clamp(opts.amount ?? 0);
  const center =
    opts.focus && amount > 0
      ? lerpLngLat(cam.center, opts.focus, amount * 0.32)
      : cam.center;
  return pose({
    phase: "day",
    center,
    zoom: cam.zoom + amount * 0.48,
    pitch: cam.pitch,
    bearing: cam.bearing,
    showFlight: false,
    flightT: 0,
    flightLeg: null,
    trailT: opts.trailT,
    voxelOpacity: opts.voxel ?? 0,
    climbM: opts.climb ?? 1200,
    dayId: opts.dayId,
    label: opts.label,
    here: opts.here ?? null,
    focusStopId: opts.focusStopId ?? null,
    expandedClusterIds: opts.expandedClusterIds,
    visitedClusterIds: opts.visitedClusterIds,
  });
}

export const OVERVIEW: JourneyView = pose({
  phase: "overview",
  center: [11.72, 46.88],
  zoom: 6.35,
  pitch: 0,
  bearing: 0,
  showFlight: false,
  flightT: 0,
  flightLeg: null,
  trailT: 0,
  jump: true,
  dayId: null,
  label: "The route",
  expandedClusterIds: [],
  visitedClusterIds: [],
});

const ATLANTIC_CENTER: LngLat = [-41.5, 52];
const ATLANTIC_ZOOM = 3.05;
const USA_CENTER: LngLat = [-97.2, 42];
const USA_ZOOM = 3.05;
const OCEAN_ZOOM = 2.15;

function usaDepartView(): JourneyView {
  return pose({
    phase: "flight",
    center: USA_CENTER,
    zoom: USA_ZOOM,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT: 0.006,
    flightLeg: "out",
    trailT: 0,
    jump: true,
    dayId: 1,
    label: "Kansas City → Munich",
    expandedClusterIds: [],
    visitedClusterIds: [],
  });
}

function flightOutView(t: number): JourneyView {
  const u = clamp(t);
  let zoom: number;
  let center: LngLat;
  if (u < 0.1) {
    zoom = USA_ZOOM;
    center = USA_CENTER;
  } else if (u < 0.26) {
    const k = smoothstep((u - 0.1) / 0.16);
    zoom = lerp(USA_ZOOM, OCEAN_ZOOM, k);
    center = lerpLngLat(USA_CENTER, ATLANTIC_CENTER, k);
  } else if (u < 0.76) {
    zoom = OCEAN_ZOOM;
    center = ATLANTIC_CENTER;
  } else {
    const k = smoothstep((u - 0.76) / 0.24);
    zoom = lerp(OCEAN_ZOOM, CITY.munichAirport.zoom, k);
    center = lerpLngLat(ATLANTIC_CENTER, CITY.munichAirport.center, k);
  }
  const flightT =
    u < 0.76 ? Math.max(0.006, u) : lerp(0.76, 0.97, smoothstep((u - 0.76) / 0.24));
  return pose({
    phase: "flight",
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT,
    flightLeg: "out",
    trailT: 0,
    jump: false,
    dayId: 1,
    label: "Kansas City → Munich",
    expandedClusterIds: [],
    visitedClusterIds: [],
  });
}

function flightHomeView(t: number): JourneyView {
  const u = clamp(t);
  const zoom =
    u < 0.16
      ? lerp(CITY.venice.zoom, ATLANTIC_ZOOM, smoothstep(u / 0.16))
      : ATLANTIC_ZOOM;
  const center =
    u < 0.16
      ? lerpLngLat(CITY.venice.center, ATLANTIC_CENTER, smoothstep(u / 0.16))
      : ATLANTIC_CENTER;
  return pose({
    phase: "flight",
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    showFlight: true,
    flightT: Math.max(0.006, u),
    flightLeg: "home",
    trailT: 1,
    voxelOpacity: 0,
    jump: false,
    dayId: 10,
    label: "Venice → Kansas City",
    expandedClusterIds: [],
    visitedClusterIds: ["munich", "innsbruck", "dolomites", "venice"],
  });
}

function mucArrival(t: number): JourneyView {
  const u = clamp(t);
  const onGround = u >= 0.48;
  const touchdown = smoothstep(Math.min(1, u / 0.48));
  return pose({
    phase: onGround ? "day" : "flight",
    center: CITY.munichAirport.center,
    zoom: CITY.munichAirport.zoom + u * 0.38,
    pitch: 0,
    bearing: 0,
    showFlight: !onGround,
    flightT: lerp(0.97, 1, touchdown),
    flightLeg: "out",
    trailT: 0,
    dayId: 2,
    label: "Arrive Munich",
    here: MUC,
    focusStopId: "muc",
    expandedClusterIds: ["munich"],
    visitedClusterIds: [],
  });
}

function munichStay(
  dayId: number,
  label: string,
  extra?: { here?: LngLat; focusStopId?: string; amount?: number; focus?: LngLat },
): JourneyView {
  return cityHold(CITY.munich, {
    dayId,
    label,
    trailT: 0,
    here: extra?.here ?? WOMBAT,
    focusStopId: extra?.focusStopId ?? "wombat",
    focus: extra?.focus ?? extra?.here,
    amount: extra?.amount ?? 0,
    expandedClusterIds: ["munich"],
    visitedClusterIds: [],
  });
}

function rideLine(
  from: JourneyView,
  travel: JourneyView,
  arrive: JourneyView,
  line: LngLat[],
  trailFrom: number,
  trailTo: number,
  t: number,
): JourneyView {
  if (t < 0.1) return mix(from, travel, t / 0.1);
  if (t < 0.86) {
    const u = smoothstep((t - 0.1) / 0.76);
    return {
      ...travel,
      here: along(line, u),
      trailT: lerp(trailFrom, trailTo, u),
      jump: false,
    };
  }
  return mix(
    {
      ...travel,
      here: along(line, 1),
      trailT: trailTo,
    },
    arrive,
    (t - 0.86) / 0.14,
  );
}

function viewForDay(dayId: number): JourneyView {
  const day = days[dayId - 1];
  if (!day) return OVERVIEW;
  const label = `Day ${day.id} · ${day.stripLabel}`;
  switch (dayId) {
    case 1:
      return usaDepartView();
    case 2:
      return mucArrival(0);
    case 3:
    case 4:
      return munichStay(dayId, label);
    case 5:
      return cityHold(CITY.innsbruck, {
        dayId: 5,
        label,
        trailT: T.montagu,
        here: MONTAGU,
        focusStopId: "montagu",
        expandedClusterIds: ["innsbruck"],
        visitedClusterIds: ["munich"],
      });
    case 6:
      return cityHold(CITY.dolomites, {
        dayId: 6,
        label,
        trailT: T.resciesa,
        here: RESCIESA,
        focusStopId: "resciesa",
        focus: RESCIESA,
        amount: 0.22,
        voxel: 0.7,
        climb: 1800,
        expandedClusterIds: ["dolomites"],
        visitedClusterIds: ["munich", "innsbruck"],
      });
    case 7:
      return cityHold(CITY.dolomites, {
        dayId: 7,
        label,
        trailT: T.firenze,
        here: FIRENZE,
        focusStopId: "firenze",
        focus: FIRENZE,
        amount: 0.28,
        voxel: 1,
        climb: 2100,
        expandedClusterIds: ["dolomites"],
        visitedClusterIds: ["munich", "innsbruck"],
      });
    case 8:
      return cityHold(CITY.dolomites, {
        dayId: 8,
        label,
        trailT: T.puez,
        here: PUEZ,
        focusStopId: "puez",
        focus: PUEZ,
        amount: 0.2,
        voxel: 0.7,
        climb: 1700,
        expandedClusterIds: ["dolomites"],
        visitedClusterIds: ["munich", "innsbruck"],
      });
    case 9:
      return cityHold(CITY.venice, {
        dayId: 9,
        label,
        trailT: T.venice,
        here: VENICE,
        focusStopId: "venice-tbd",
        expandedClusterIds: ["venice"],
        visitedClusterIds: ["munich", "innsbruck", "dolomites"],
      });
    case 10:
      return cityHold(CITY.venice, {
        dayId: 10,
        label,
        trailT: 1,
        here: VCE,
        focusStopId: "vce",
        focus: VCE,
        amount: 0.22,
        expandedClusterIds: ["venice"],
        visitedClusterIds: ["munich", "innsbruck", "dolomites"],
      });
    default:
      return OVERVIEW;
  }
}

function viewForBeat(dayId: number, beatId: string, t: number): JourneyView {
  switch (beatId) {
    case "depart-mci":
      return usaDepartView();
    case "flight-out":
      return flightOutView(t);
    case "arrive-muc":
      return mucArrival(t);
    case "airport-train": {
      const u = smoothstep(clamp(t));
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
      };
    }
    case "check-in-wombat": {
      const u = smoothstep(clamp(t));
      const here = along(walkWombatHbf, 1 - u);
      return munichStay(2, "The Wombat Hostel", {
        here,
        focusStopId: "wombat",
        focus: here,
        amount: lerp(0.16, 0.34, u),
      });
    }
    case "wombat-hostel":
      return munichStay(dayId, "The Wombat Hostel", {
        here: WOMBAT,
        focusStopId: "wombat",
        amount: 0.28,
      });
    case "open-munich":
      return munichStay(3, "Day 3 · Munich");
    case "eisbachwelle":
      return munichStay(3, "Eisbachwelle", {
        here: EISBACHWELLE,
        focusStopId: "eisbachwelle",
        focus: EISBACHWELLE,
        amount: 0.4,
      });
    case "leave-wombat":
      return munichStay(4, "Leave Wombat", {
        here: WOMBAT,
        focusStopId: "wombat",
        amount: 0.32,
      });
    case "walk-hbf": {
      const u = clamp((t - 0.12) / 0.7);
      const here = along(walkWombatHbf, u);
      return munichStay(4, "Walk to Hbf", {
        here,
        focusStopId: "wombat",
        focus: here,
        amount: 0.38,
      });
    }
    case "train-munich-innsbruck":
      return rideLine(
        munichStay(4, "München Hbf", {
          here: MUNICH_HBF,
          focusStopId: "wombat",
          amount: 0.16,
        }),
        pose({
          phase: "day",
          center: CITY.munichInnsbruck.center,
          zoom: CITY.munichInnsbruck.zoom,
          pitch: CITY.munichInnsbruck.pitch,
          bearing: CITY.munichInnsbruck.bearing,
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: T.hbf,
          dayId: 4,
          label: "Munich → Innsbruck",
          here: MUNICH_HBF,
          expandedClusterIds: [],
          visitedClusterIds: ["munich"],
        }),
        cityHold(CITY.innsbruck, {
          dayId: 4,
          label: "Innsbruck",
          trailT: T.innsbruck,
          here: INNSBRUCK_HBF,
          expandedClusterIds: ["innsbruck"],
          visitedClusterIds: ["munich"],
        }),
        railMunichInnsbruck,
        T.hbf,
        T.innsbruck,
        t,
      );
    case "check-in-montagu":
    case "montagu-hostel":
      return cityHold(CITY.innsbruck, {
        dayId: 4,
        label: "Montagu Hostel",
        trailT: T.montagu,
        here: MONTAGU,
        focusStopId: "montagu",
        focus: MONTAGU,
        amount: 0.32,
        expandedClusterIds: ["innsbruck"],
        visitedClusterIds: ["munich"],
      });
    case "train-innsbruck-bolzano":
      return rideLine(
        cityHold(CITY.innsbruck, {
          dayId: 5,
          label: "Innsbruck → Bolzano",
          trailT: T.montagu,
          here: INNSBRUCK_HBF,
          focusStopId: "montagu",
          expandedClusterIds: ["innsbruck"],
          visitedClusterIds: ["munich"],
        }),
        pose({
          phase: "day",
          center: CITY.innsbruckBolzano.center,
          zoom: CITY.innsbruckBolzano.zoom,
          pitch: CITY.innsbruckBolzano.pitch,
          bearing: CITY.innsbruckBolzano.bearing,
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: T.innsbruck,
          dayId: 5,
          label: "Innsbruck → Bolzano",
          here: INNSBRUCK_HBF,
          expandedClusterIds: [],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.bolzanoOrtisei, {
          dayId: 5,
          label: "Bolzano",
          trailT: T.bolzano,
          here: BOLZANO,
          focusStopId: "bolzano",
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        railInnsbruckBolzano,
        T.innsbruck,
        T.bolzano,
        t,
      );
    case "bus-bolzano-ortisei":
      return rideLine(
        cityHold(CITY.bolzanoOrtisei, {
          dayId: 5,
          label: "Bolzano → Ortisei",
          trailT: T.bolzano,
          here: BOLZANO,
          focusStopId: "bolzano",
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.bolzanoOrtisei, {
          dayId: 5,
          label: "Bolzano → Ortisei",
          trailT: T.ortisei,
          here: ORTISEI,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.dolomites, {
          dayId: 5,
          label: "Ortisei",
          trailT: T.ortisei,
          here: ORTISEI,
          focusStopId: "ortisei",
          focus: ORTISEI,
          amount: 0.18,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        busBolzanoOrtisei,
        T.bolzano,
        T.ortisei,
        t,
      );
    case "onto-the-trail":
      return rideLine(
        cityHold(CITY.dolomites, {
          dayId: 5,
          label: "Ortisei → Resciesa",
          trailT: T.ortisei,
          here: ORTISEI,
          focusStopId: "ortisei",
          voxel: 0.45,
          climb: 1400,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.dolomites, {
          dayId: 5,
          label: "Ortisei → Resciesa",
          trailT: T.resciesa,
          here: RESCIESA,
          focus: RESCIESA,
          amount: 0.24,
          voxel: 1,
          climb: 2200,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.dolomites, {
          dayId: 5,
          label: "Rifugio Resciesa",
          trailT: T.resciesa,
          here: RESCIESA,
          focusStopId: "resciesa",
          focus: RESCIESA,
          amount: 0.3,
          voxel: 1,
          climb: 2200,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        trailOrtiseiResciesa,
        T.ortisei,
        T.resciesa,
        t,
      );
    case "rifugio-resciesa":
      return cityHold(CITY.dolomites, {
        dayId: 5,
        label: "Rifugio Resciesa",
        trailT: T.resciesa,
        here: RESCIESA,
        focusStopId: "resciesa",
        focus: RESCIESA,
        amount: 0.3,
        voxel: 1,
        climb: 2200,
        expandedClusterIds: ["dolomites"],
        visitedClusterIds: ["munich", "innsbruck"],
      });
    case "hike-resciesa-firenze":
      return rideLine(
        cityHold(CITY.dolomites, {
          dayId: 6,
          label: "Resciesa → Firenze",
          trailT: T.resciesa,
          here: RESCIESA,
          focusStopId: "resciesa",
          voxel: 0.8,
          climb: 1900,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.dolomites, {
          dayId: 6,
          label: "Resciesa → Firenze",
          trailT: T.firenze,
          here: FIRENZE,
          focus: FIRENZE,
          amount: 0.22,
          voxel: 1,
          climb: 2300,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.dolomites, {
          dayId: 6,
          label: "Rifugio Firenze",
          trailT: T.firenze,
          here: FIRENZE,
          focusStopId: "firenze",
          focus: FIRENZE,
          amount: 0.28,
          voxel: 1,
          climb: 2300,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        trailResciesaFirenze,
        T.resciesa,
        T.firenze,
        t,
      );
    case "rifugio-firenze":
      return cityHold(CITY.dolomites, {
        dayId: 6,
        label: "Rifugio Firenze",
        trailT: T.firenze,
        here: FIRENZE,
        focusStopId: "firenze",
        focus: FIRENZE,
        amount: 0.28,
        voxel: 1,
        climb: 2300,
        expandedClusterIds: ["dolomites"],
        visitedClusterIds: ["munich", "innsbruck"],
      });
    case "hike-firenze-puez":
      return rideLine(
        cityHold(CITY.dolomites, {
          dayId: 7,
          label: "Firenze → Puez",
          trailT: T.firenze,
          here: FIRENZE,
          focusStopId: "firenze",
          voxel: 1,
          climb: 2100,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.dolomites, {
          dayId: 7,
          label: "Firenze → Puez",
          trailT: T.puez,
          here: PUEZ,
          focus: PUEZ,
          amount: 0.24,
          voxel: 1,
          climb: 2480,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        cityHold(CITY.dolomites, {
          dayId: 7,
          label: "Rifugio Puez",
          trailT: T.puez,
          here: PUEZ,
          focusStopId: "puez",
          focus: PUEZ,
          amount: 0.3,
          voxel: 1,
          climb: 2480,
          expandedClusterIds: ["dolomites"],
          visitedClusterIds: ["munich", "innsbruck"],
        }),
        trailFirenzePuez,
        T.firenze,
        T.puez,
        t,
      );
    case "rifugio-puez":
      return cityHold(CITY.dolomites, {
        dayId: 7,
        label: "Rifugio Puez",
        trailT: T.puez,
        here: PUEZ,
        focusStopId: "puez",
        focus: PUEZ,
        amount: 0.3,
        voxel: 1,
        climb: 2480,
        expandedClusterIds: ["dolomites"],
        visitedClusterIds: ["munich", "innsbruck"],
      });
    case "exit-tbd":
    case "exit-night":
      return cityHold(CITY.dolomites, {
        dayId: 8,
        label: "Exit still open",
        trailT: T.puez,
        here: PUEZ,
        focusStopId: "puez",
        amount: 0.12,
        voxel: 0.55,
        climb: 1600,
        expandedClusterIds: ["dolomites"],
        visitedClusterIds: ["munich", "innsbruck"],
      });
    case "open-venice":
    case "venice-lodging":
      return cityHold(CITY.venice, {
        dayId: 9,
        label: "Day 9 · Venice",
        trailT: T.venice,
        here: VENICE,
        focusStopId: "venice-tbd",
        expandedClusterIds: ["venice"],
        visitedClusterIds: ["munich", "innsbruck", "dolomites"],
      });
    case "flight-home":
      return flightHomeView(t);
    default:
      return viewForDay(dayId);
  }
}

function mix(a: JourneyView, b: JourneyView, t: number): JourneyView {
  const u = smoothstep(t);
  const pick = u < 0.5 ? a : b;
  const flightMix = lerp(a.showFlight ? 1 : 0, b.showFlight ? 1 : 0, u);
  const showFlight = flightMix > 0.28;
  return {
    phase: showFlight ? "flight" : pick.phase,
    bounds: pick.bounds,
    center: lerpLngLat(a.center, b.center, u),
    zoom: lerp(a.zoom, b.zoom, u),
    pitch: lerp(a.pitch, b.pitch, u),
    bearing: lerpBearing(a.bearing, b.bearing, u),
    showFlight,
    flightT: lerp(a.flightT, b.flightT, u),
    flightLeg: showFlight
      ? (a.flightLeg ?? b.flightLeg)
      : pick.flightLeg,
    trailT: lerp(a.trailT, b.trailT, u),
    voxelOpacity: lerp(a.voxelOpacity, b.voxelOpacity, u),
    climbM: lerp(a.climbM, b.climbM, u),
    jump: false,
    dayId: pick.dayId,
    label: pick.label,
    expandedClusterIds: pick.expandedClusterIds,
    visitedClusterIds: pick.visitedClusterIds,
    here:
      a.here && b.here
        ? lerpLngLat(a.here, b.here, u)
        : u < 0.5
          ? a.here
          : b.here,
    focusStopId: pick.focusStopId,
  };
}

function holdThen(current: JourneyView, next: JourneyView, t: number) {
  if (t < HOLD) return current;
  return mix(current, next, (t - HOLD) / (1 - HOLD));
}

function sectionProgress(
  current: HTMLElement,
  next: HTMLElement | undefined,
  anchor: number,
) {
  const start = current.getBoundingClientRect().top;
  const end = next
    ? next.getBoundingClientRect().top
    : current.getBoundingClientRect().bottom;
  const span = end - start;
  return span <= 0 ? 0 : clamp((anchor - start) / span);
}

function readDayBeats(
  current: HTMLElement,
  next: HTMLElement | undefined,
  viewportHeight: number,
): JourneyView {
  const dayId = Number(current.dataset.day);
  const anchor = viewportHeight * 0.4;
  const beats = [...current.querySelectorAll<HTMLElement>("[data-beat]")];
  if (beats.length === 0) {
    const t = sectionProgress(current, next, anchor);
    return next
      ? holdThen(viewForDay(dayId), viewForDay(Number(next.dataset.day)), t)
      : viewForDay(dayId);
  }

  let index = -1;
  for (let i = 0; i < beats.length; i += 1) {
    if (beats[i].getBoundingClientRect().top <= anchor) index = i;
    else break;
  }
  if (index < 0) {
    const first = beats[0];
    return first
      ? viewForBeat(dayId, first.dataset.beat ?? "", 0)
      : viewForDay(dayId);
  }

  const beat = beats[index];
  const following = beats[index + 1];
  const t = sectionProgress(beat, following ?? next, anchor);
  const view = viewForBeat(dayId, beat.dataset.beat ?? "", t);
  if (!following && next && t > 0.72) {
    const nextDayId = Number(next.dataset.day);
    const nextBeat = next.querySelector<HTMLElement>("[data-beat]");
    const incoming = nextBeat
      ? viewForBeat(nextDayId, nextBeat.dataset.beat ?? "", 0)
      : viewForDay(nextDayId);
    return mix(view, incoming, (t - 0.72) / 0.28);
  }
  return view;
}

export function readJourneyView(
  hero: HTMLElement | null,
  sections: HTMLElement[],
  viewportHeight: number,
): JourneyView {
  const anchor = viewportHeight * 0.4;

  if (!(hero instanceof HTMLElement)) return OVERVIEW;

  const heroRect = hero.getBoundingClientRect();
  if (heroRect.bottom > viewportHeight * FREEZE) {
    return OVERVIEW;
  }

  if (sections.length === 0) return OVERVIEW;

  let index = 0;
  for (let i = 0; i < sections.length; i += 1) {
    if (sections[i].getBoundingClientRect().top <= anchor) index = i;
    else break;
  }

  const current = sections[index];
  const next = sections[index + 1];
  const dayId = Number(current.dataset.day);

  if (dayId === 10) {
    const bottom = current.getBoundingClientRect().bottom;
    if (!next && bottom < viewportHeight * 0.32) {
      return { ...OVERVIEW, trailT: 1, label: "The route", jump: false };
    }
  }

  return readDayBeats(current, next, viewportHeight);
}
