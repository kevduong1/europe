"use client";

import dynamic from "next/dynamic";
import { days } from "@/trip";
import { DayDots } from "./chrome/day-dots";
import { SkipLinks } from "./chrome/skip-links";
import { TripHeader } from "./chrome/trip-header";
import { EssentialsSection } from "./essentials-section";
import { Hero } from "./hero";
import { useRouteScroll } from "./hooks/use-route-scroll";
import { useScrollSync } from "./hooks/use-scroll-sync";
import { Itinerary } from "./itinerary/itinerary";
import { RegisterSw } from "./register-sw";

const JourneyMap = dynamic(
  () => import("./map/journey-map").then((module) => module.JourneyMap),
  { ssr: false },
);

export function TripShell() {
  const {
    mapRef,
    mapStageRef,
    headerRef,
    labelRef,
    mapReady,
    setMapReady,
    activeDayId,
    itineraryMode,
    syncChrome,
    syncAll,
  } = useScrollSync();
  useRouteScroll(syncChrome, syncAll);
  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0];

  return (
    <div className="relative">
      <SkipLinks />
      <div ref={mapStageRef} className="map-stage">
        {mapReady ? null : (
          <p className="absolute right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[1] font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dolomite)]">
            Loading map
          </p>
        )}
        <JourneyMap
          ref={mapRef}
          onReady={() => {
            setMapReady(true);
            syncChrome();
            syncAll();
          }}
        />
      </div>

      <TripHeader
        headerRef={headerRef}
        labelRef={labelRef}
        itineraryMode={itineraryMode}
        activeDay={activeDay}
      />
      <DayDots
        days={days}
        activeDay={activeDay}
        visible={itineraryMode}
      />

      <main className="relative z-10">
        <Hero />
        <Itinerary />
        <EssentialsSection />
        <footer className="relative z-10 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 text-center">
          <p className="overlay-type font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
            Europe 2026 · Munich to Venice
          </p>
        </footer>
      </main>
      <RegisterSw />
    </div>
  );
}
