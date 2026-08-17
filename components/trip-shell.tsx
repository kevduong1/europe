"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getDestination } from "@/data/trip";
import { EssentialsSection } from "./essentials-section";
import { Hero } from "./hero";
import { Itinerary } from "./itinerary";
import type { JourneyMapHandle } from "./journey-map";
import { readJourneyView } from "@/lib/journey-view";
import { parseTripPath } from "@/lib/paths";
import { RegisterSw } from "./register-sw";

const JourneyMap = dynamic(
  () => import("./journey-map").then((mod) => mod.JourneyMap),
  { ssr: false },
);

function targetIdForPath(pathname: string) {
  const route = parseTripPath(pathname);
  if (route.view === "journey" && route.essentials) return "essentials";
  if (route.view === "day") return `day-${route.dayId}`;
  if (route.view === "journey" && route.destination) {
    const destination = getDestination(route.destination);
    if (destination) return `day-${destination.dayIds[0]}`;
  }
  return null;
}

export function TripShell() {
  const pathname = usePathname();
  const mapRef = useRef<JourneyMapHandle | null>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const lastLabel = useRef("");
  const ticking = useRef(false);

  function syncMap() {
    const hero = document.getElementById("hero");
    const sections = [
      ...document.querySelectorAll<HTMLElement>("[data-day]"),
    ];
    const view = readJourneyView(hero, sections, window.innerHeight);
    mapRef.current?.setView(view);
    if (labelRef.current && view.label !== lastLabel.current) {
      lastLabel.current = view.label;
      labelRef.current.textContent = view.label;
    }
  }

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        syncMap();
        ticking.current = false;
      });
    };
    const onResize = () => {
      mapRef.current?.resize();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const id = targetIdForPath(pathname);
    if (!id) return;
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ behavior: "auto", block: "start" });
    requestAnimationFrame(syncMap);
  }, [pathname]);

  return (
    <div className="relative">
      <a
        href="#itinerary"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--paper)] focus:px-3 focus:py-2"
      >
        Skip to itinerary
      </a>

      <div className="map-stage">
        <JourneyMap ref={mapRef} onReady={syncMap} />
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-[var(--paper)]/90 to-transparent" />

      <p
        ref={labelRef}
        className="pointer-events-none fixed left-4 right-4 z-30 pt-[max(12px,env(safe-area-inset-top))] text-center font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink)]"
      >
        The route
      </p>

      <main className="relative z-10">
        <Hero />
        <Itinerary />
        <EssentialsSection />
        <footer className="relative z-10 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
            Europe 2026 · Munich to Venice
          </p>
        </footer>
      </main>

      <RegisterSw />
    </div>
  );
}
