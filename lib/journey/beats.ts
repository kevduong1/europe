import {
  BOLZANO,
  busBolzanoOrtisei,
  busOrtiseiBolzano,
  EISBACHWELLE,
  FIRENZE,
  INNSBRUCK_HBF,
  MONTAGU,
  MUNICH_HBF,
  ORTISEI,
  PUEZ,
  railBolzanoVenice,
  railInnsbruckBolzano,
  railMucHbf,
  railMunichInnsbruck,
  RESCIESA,
  trailFirenzePuez,
  trailOrtiseiResciesa,
  trailPuezValGardena,
  trailResciesaFirenze,
  VCE,
  VENICE,
  walkWombatHbf,
  WOMBAT,
} from "@/data/route";
import { getDay } from "@/data/trip";
import { along, clamp, lerp, smoothstep } from "@/lib/geo";
import {
  CITY,
  cityHold,
  flightHomeView,
  flightOutView,
  mucArrival,
  munichStay,
  OVERVIEW,
  pose,
  T,
  usaDepartView,
} from "./cameras";
import { CLUSTERS } from "./clusters";
import { mix, rideLine } from "./transitions";
import type { JourneyView } from "./types";

/**
 * Where a day opens, used when a day section has no beats of its own and as the
 * fallback for an unrecognised beat id. Each case is the day's *starting*
 * ground, not its destination.
 */
export function viewForDay(dayId: number): JourneyView {
  const day = getDay(dayId);
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
        expandedClusterIds: CLUSTERS.innsbruck,
        visitedClusterIds: CLUSTERS.munich,
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
        expandedClusterIds: CLUSTERS.dolomites,
        visitedClusterIds: CLUSTERS.pastInnsbruck,
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
        expandedClusterIds: CLUSTERS.dolomites,
        visitedClusterIds: CLUSTERS.pastInnsbruck,
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
        expandedClusterIds: CLUSTERS.dolomites,
        visitedClusterIds: CLUSTERS.pastInnsbruck,
      });
    case 9:
      return cityHold(CITY.venice, {
        dayId: 9,
        label,
        trailT: T.venice,
        here: VENICE,
        focusStopId: "venice-tbd",
        expandedClusterIds: CLUSTERS.venice,
        visitedClusterIds: CLUSTERS.pastDolomites,
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
        expandedClusterIds: CLUSTERS.venice,
        visitedClusterIds: CLUSTERS.pastDolomites,
      });
    default:
      return OVERVIEW;
  }
}

/** The rifugio you sleep in is the same shot whether you arrive or wake there. */
function resciesaHold(): JourneyView {
  return cityHold(CITY.dolomites, {
    dayId: 5,
    label: "Rifugio Resciesa",
    trailT: T.resciesa,
    here: RESCIESA,
    focusStopId: "resciesa",
    focus: RESCIESA,
    amount: 0.3,
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

function firenzeHold(): JourneyView {
  return cityHold(CITY.dolomites, {
    dayId: 6,
    label: "Rifugio Firenze",
    trailT: T.firenze,
    here: FIRENZE,
    focusStopId: "firenze",
    focus: FIRENZE,
    amount: 0.28,
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

function puezHold(): JourneyView {
  return cityHold(CITY.dolomites, {
    dayId: 7,
    label: "Rifugio Puez",
    trailT: T.puez,
    here: PUEZ,
    focusStopId: "puez",
    focus: PUEZ,
    amount: 0.3,
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

/**
 * The camera for one timeline beat at scroll progress `t` (0..1 across that
 * beat's box). Beat ids come from `data/trip.ts` timeline item ids and lodging
 * slugs, rendered as `data-beat` attributes by the timeline.
 */
export function viewForBeat(dayId: number, beatId: string, t: number): JourneyView {
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
        expandedClusterIds: CLUSTERS.innsbruck,
        visitedClusterIds: CLUSTERS.munich,
      });
    case "train-innsbruck-bolzano":
      return rideLine(
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
        t,
      );
    case "rifugio-resciesa":
      return resciesaHold();
    case "hike-resciesa-firenze":
      return rideLine(
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
        t,
      );
    case "rifugio-firenze":
      return firenzeHold();
    case "hike-firenze-puez":
      return rideLine(
        cityHold(CITY.dolomites, {
          dayId: 7,
          label: "Firenze → Puez",
          trailT: T.firenze,
          here: FIRENZE,
          focusStopId: "firenze",
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        cityHold(CITY.dolomites, {
          dayId: 7,
          label: "Firenze → Puez",
          trailT: T.puez,
          here: PUEZ,
          focus: PUEZ,
          amount: 0.24,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        puezHold(),
        trailFirenzePuez,
        T.firenze,
        T.puez,
        t,
      );
    case "rifugio-puez":
      return puezHold();
    case "exit-to-valley":
      return rideLine(
        cityHold(CITY.dolomites, {
          dayId: 8,
          label: "Rifugio Puez → Val Gardena",
          trailT: T.puez,
          here: PUEZ,
          focusStopId: "puez",
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        pose({
          phase: "day",
          center: CITY.valGardena.center,
          zoom: CITY.valGardena.zoom,
          pitch: CITY.valGardena.pitch,
          bearing: CITY.valGardena.bearing,
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: T.puez,
          dayId: 8,
          label: "Rifugio Puez → Val Gardena",
          here: PUEZ,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        cityHold(CITY.valGardena, {
          dayId: 8,
          label: "Ortisei",
          trailT: T.ortiseiOut,
          here: ORTISEI,
          focusStopId: "ortisei",
          focus: ORTISEI,
          amount: 0.22,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        trailPuezValGardena,
        T.puez,
        T.ortiseiOut,
        t,
      );
    case "bus-ortisei-bolzano":
      return rideLine(
        cityHold(CITY.valGardena, {
          dayId: 8,
          label: "Val Gardena → Bolzano",
          trailT: T.ortiseiOut,
          here: ORTISEI,
          focusStopId: "ortisei",
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        pose({
          phase: "day",
          center: CITY.valGardena.center,
          zoom: CITY.valGardena.zoom,
          pitch: CITY.valGardena.pitch,
          bearing: CITY.valGardena.bearing,
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: T.ortiseiOut,
          dayId: 8,
          label: "Val Gardena → Bolzano",
          here: ORTISEI,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        cityHold(CITY.valGardena, {
          dayId: 8,
          label: "Bolzano",
          trailT: T.bolzanoOut,
          here: BOLZANO,
          focusStopId: "bolzano",
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        busOrtiseiBolzano,
        T.ortiseiOut,
        T.bolzanoOut,
        t,
      );
    case "train-bolzano-venice":
      return rideLine(
        cityHold(CITY.valGardena, {
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
          center: CITY.toVenice.center,
          zoom: CITY.toVenice.zoom,
          pitch: CITY.toVenice.pitch,
          bearing: CITY.toVenice.bearing,
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
        t,
      );
    case "venice-first-night":
      return cityHold(CITY.venice, {
        dayId: 8,
        label: "First night in Venice",
        trailT: T.venice,
        here: VENICE,
        focusStopId: "venice-tbd",
        expandedClusterIds: CLUSTERS.venice,
        visitedClusterIds: CLUSTERS.pastDolomites,
      });
    case "open-venice":
    case "venice-lodging":
      return cityHold(CITY.venice, {
        dayId: 9,
        label: "Day 9 · Venice",
        trailT: T.venice,
        here: VENICE,
        focusStopId: "venice-tbd",
        expandedClusterIds: CLUSTERS.venice,
        visitedClusterIds: CLUSTERS.pastDolomites,
      });
    case "flight-home":
      return flightHomeView(t);
    default:
      return viewForDay(dayId);
  }
}
