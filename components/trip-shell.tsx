"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getDestination, trip } from "@/data/trip";
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
  const headerRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const lastLabel = useRef("");
  const ticking = useRef(false);

  function syncChrome() {
    const header = headerRef.current;
    if (header) {
      document.documentElement.style.setProperty(
        "--trip-header-height",
        `${Math.round(header.getBoundingClientRect().height)}px`,
      );
    }

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / max));
    document.documentElement.style.setProperty(
      "--trip-progress",
      progress.toFixed(4),
    );
  }

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
        try {
          syncChrome();
          syncMap();
        } finally {
          ticking.current = false;
        }
      });
    };
    const onResize = () => {
      mapRef.current?.resize();
      onScroll();
    };

    const header = headerRef.current;
    const headerObserver =
      header && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncChrome();
          })
        : null;
    if (header && headerObserver) headerObserver.observe(header);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    onScroll();
    return () => {
      headerObserver?.disconnect();
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
    requestAnimationFrame(() => {
      syncChrome();
      syncMap();
    });
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
        <JourneyMap
          ref={mapRef}
          onReady={() => {
            syncChrome();
            syncMap();
          }}
        />
      </div>

      <header ref={headerRef} className="trip-header">
        <div className="trip-header-inner">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--trail)]">
              {trip.eyebrow}
            </p>
            <p className="font-display mt-0.5 text-[22px] leading-none [font-variation-settings:'WONK'_0.7,'opsz'_22] sm:text-[24px]">
              {trip.title}
            </p>
          </div>
          <p
            ref={labelRef}
            className="max-w-[46%] text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink)] sm:text-[11px]"
          >
            The route
          </p>
          <div className="trip-progress" aria-hidden="true">
            <div className="trip-progress-fill" />
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <Hero />
        <Itinerary />
        <EssentialsSection />
        <footer className="overlay-panel relative z-10 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 text-center">
          <p className="overlay-type font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
            Europe 2026 · Munich to Venice
          </p>
        </footer>
      </main>

      <RegisterSw />
    </div>
  );
}
