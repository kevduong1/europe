import {
  BOLZANO,
  busBolzanoOrtisei,
  busFassaBolzano,
  busOrtiseiValDiFassa,
  EISBACHWELLE,
  FIRENZE,
  gondolaSecedaOrtisei,
  HOFBRAUHAUS,
  INNSBRUCK_HBF,
  KLEINHESSELOHER_SEE,
  MONTAGU,
  MUNICH_HBF,
  ORTISEI,
  QC_TERME,
  railBolzanoVenice,
  railInnsbruckBolzano,
  railMucHbf,
  railMunichInnsbruck,
  RESCIESA,
  SECEDA,
  trailFirenzeSeceda,
  trailOrtiseiResciesa,
  trailResciesaFirenze,
  VCE,
  VENICE,
  walkEnglischerGarten,
  walkGardenHofbrauhaus,
  walkWombatHbf,
  WOMBAT,
} from "@/data/route";
import { getDay } from "@/data/trip";
import { along, clamp, lerp, lerpBearing, lerpLngLat, smoothstep } from "@/lib/geo";
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
import { hikeLine, mix, rideLine } from "./transitions";
import type { JourneyView } from "./types";

function wombatClose(dayId: number, label: string): JourneyView {
  return pose({
    phase: "day",
    center: WOMBAT,
    zoom: 15.25,
    pitch: 34,
    bearing: 58,
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

/** Zoom and orbit in, hold on the hostel photos, then return to the city. */
function wombatMoment(
  dayId: number,
  label: string,
  t: number,
  arriving = false,
): JourneyView {
  const u = clamp(t);
  const approach = smoothstep(clamp(u / 0.2));
  const here = arriving ? along(walkWombatHbf, 1 - approach) : WOMBAT;
  const wide = munichStay(dayId, label, {
    here,
    focusStopId: null,
    focus: here,
    amount: arriving ? lerp(0.12, 0.2, approach) : 0,
  });
  const close = wombatClose(dayId, label);
  let view: JourneyView;

  if (u < 0.36) {
    view = mix(wide, close, clamp((u - 0.08) / 0.28));
  } else if (u < 0.7) {
    view = close;
  } else {
    view = mix(
      close,
      munichStay(dayId, "Munich", {
        here: WOMBAT,
        focusStopId: null,
      }),
      (u - 0.7) / 0.3,
    );
  }

  return arriving
    ? { ...view, localRouteId: "hbf-wombat", localRouteT: approach }
    : view;
}

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
      return cityHold(CITY.resciesa, {
        dayId: 6,
        label,
        trailT: T.resciesa,
        here: RESCIESA,
        focusStopId: "resciesa",
        expandedClusterIds: CLUSTERS.dolomites,
        visitedClusterIds: CLUSTERS.pastInnsbruck,
      });
    case 7:
      return cityHold(CITY.firenze, {
        dayId: 7,
        label,
        trailT: T.firenze,
        here: FIRENZE,
        focusStopId: "firenze",
        expandedClusterIds: CLUSTERS.dolomites,
        visitedClusterIds: CLUSTERS.pastInnsbruck,
      });
    case 8:
      return cityHold(CITY.qcTerme, {
        dayId: 8,
        label,
        trailT: T.qcTerme,
        here: QC_TERME,
        focusStopId: "val-di-fassa-tbd",
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
  return cityHold(CITY.resciesa, {
    dayId: 5,
    label: "Rifugio Resciesa",
    trailT: T.resciesa,
    here: RESCIESA,
    focusStopId: "resciesa",
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

function firenzeHold(): JourneyView {
  return cityHold(CITY.firenze, {
    dayId: 6,
    label: "Rifugio Firenze",
    trailT: T.firenze,
    here: FIRENZE,
    focusStopId: "firenze",
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

/** The summit is the same shot whether you're climbing to it or standing on it. */
function secedaHold(): JourneyView {
  return cityHold(CITY.seceda, {
    dayId: 7,
    label: "Seceda — the Odle ridge",
    trailT: T.seceda,
    here: SECEDA,
    focusStopId: "seceda",
    focus: SECEDA,
    amount: 0.3,
    expandedClusterIds: CLUSTERS.dolomites,
    visitedClusterIds: CLUSTERS.pastInnsbruck,
  });
}

/** QC Terme is the same shot for the spa afternoon and the night that follows it. */
function qcTermeHold(): JourneyView {
  return cityHold(CITY.qcTerme, {
    dayId: 7,
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
        localRouteId: "airport-transfer",
        localRouteT: u,
      };
    }
    case "check-in-wombat": {
      return wombatMoment(2, "The Wombat Hostel", t, true);
    }
    case "wombat-hostel":
      return wombatMoment(dayId, "The Wombat Hostel", t);
    case "open-munich":
      return munichStay(3, "Day 3 · Munich");
    case "english-garden": {
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
        t,
      );
      return {
        ...view,
        focusStopId: "english-garden",
        localRouteId: "english-garden",
        localRouteT: smoothstep(clamp((t - 0.06) / 0.8)),
      };
    }
    case "hofbrauhaus": {
      // First finish the actual walk from the lake into the old town. Then
      // give the showpiece a long, independent orbit rather than tying the
      // bearing to the short arrival transition.
      const routeT = smoothstep(clamp(t / 0.22));
      const u = smoothstep(clamp((t - 0.08) / 0.7));
      return pose({
        phase: "day",
        center: lerpLngLat(CITY.munich.center, CITY.hofbrauhaus.center, u),
        zoom: lerp(CITY.munich.zoom, CITY.hofbrauhaus.zoom, u),
        pitch: lerp(CITY.munich.pitch, CITY.hofbrauhaus.pitch, u),
        bearing: lerpBearing(CITY.munich.bearing, CITY.hofbrauhaus.bearing, u),
        showFlight: false,
        flightT: 0,
        flightLeg: null,
        trailT: 0,
        dayId: 3,
        label: "Hofbräuhaus am Platzl",
        here:
          routeT >= 0.999
            ? HOFBRAUHAUS
            : along(walkGardenHofbrauhaus, routeT),
        focusStopId: u > 0.18 ? "hofbrauhaus" : null,
        localRouteId: "garden-hofbrauhaus",
        localRouteT: routeT,
        expandedClusterIds: CLUSTERS.munich,
        visitedClusterIds: CLUSTERS.none,
      });
    }
    case "leave-wombat": {
      const u = clamp((t - 0.38) / 0.5);
      return mix(
        wombatClose(4, "Leave Wombat"),
        munichStay(4, "Walk to München Hbf", {
          here: WOMBAT,
          focusStopId: null,
        }),
        u,
      );
    }
    case "walk-hbf": {
      const u = clamp((t - 0.12) / 0.7);
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
      return hikeLine(
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
      return hikeLine(
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
    case "hike-firenze-seceda":
      return hikeLine(
        firenzeHold(),
        pose({
          phase: "day",
          center: CITY.dolomites.center,
          zoom: CITY.dolomites.zoom,
          pitch: CITY.dolomites.pitch,
          bearing: CITY.dolomites.bearing,
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: T.firenze,
          dayId: 7,
          label: "Firenze → Seceda",
          here: FIRENZE,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        secedaHold(),
        trailFirenzeSeceda,
        T.firenze,
        T.seceda,
        t,
      );
    case "seceda-summit":
      return secedaHold();
    case "down-to-ortisei":
      return rideLine(
        secedaHold(),
        pose({
          phase: "day",
          center: CITY.secedaDrop.center,
          zoom: CITY.secedaDrop.zoom,
          pitch: CITY.secedaDrop.pitch,
          bearing: CITY.secedaDrop.bearing,
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: T.seceda,
          dayId: 7,
          label: "Seceda → Ortisei · gondola",
          here: SECEDA,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        cityHold(CITY.dolomites, {
          dayId: 7,
          label: "Ortisei",
          trailT: T.ortiseiBack,
          here: ORTISEI,
          focusStopId: "ortisei",
          focus: ORTISEI,
          amount: 0.18,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        gondolaSecedaOrtisei,
        T.seceda,
        T.ortiseiBack,
        t,
      );
    case "to-val-di-fassa":
      return rideLine(
        cityHold(CITY.dolomites, {
          dayId: 7,
          label: "Ortisei → Val di Fassa",
          trailT: T.ortiseiBack,
          here: ORTISEI,
          focusStopId: "ortisei",
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        pose({
          phase: "day",
          center: CITY.toValDiFassa.center,
          zoom: CITY.toValDiFassa.zoom,
          pitch: CITY.toValDiFassa.pitch,
          bearing: CITY.toValDiFassa.bearing,
          showFlight: false,
          flightT: 0,
          flightLeg: null,
          trailT: T.ortiseiBack,
          dayId: 7,
          label: "Ortisei → Val di Fassa",
          here: ORTISEI,
          expandedClusterIds: CLUSTERS.dolomites,
          visitedClusterIds: CLUSTERS.pastInnsbruck,
        }),
        qcTermeHold(),
        busOrtiseiValDiFassa,
        T.ortiseiBack,
        T.qcTerme,
        t,
      );
    case "qc-terme-dolomiti":
    case "val-di-fassa-night":
      return qcTermeHold();
    case "bus-fassa-bolzano":
      return rideLine(
        qcTermeHold(),
        pose({
          phase: "day",
          center: CITY.fassaBolzano.center,
          zoom: CITY.fassaBolzano.zoom,
          pitch: CITY.fassaBolzano.pitch,
          bearing: CITY.fassaBolzano.bearing,
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
        t,
      );
    case "train-bolzano-venice":
      return rideLine(
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
