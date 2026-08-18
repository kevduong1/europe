"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { days, getDestination, trip } from "@/data/trip";
import { clamp } from "@/lib/geo";
import {
  DAY_ANCHOR_MAX_PX,
  DAY_ANCHOR_VH,
  DAY_FADE_START_MAX_PX,
  DAY_FADE_START_VH,
} from "@/lib/journey/pacing";
import { EssentialsSection } from "./essentials-section";
import { Hero } from "./hero";
import { Itinerary } from "./itinerary";
import type { JourneyMapHandle } from "./journey-map";
import { readJourneyView } from "@/lib/journey-view";
import { beatIdForDetail, parseTripPath } from "@/lib/paths";
import { RegisterSw } from "./register-sw";

const JourneyMap = dynamic(
  () => import("./journey-map").then((mod) => mod.JourneyMap),
  { ssr: false },
);

function targetForPath(pathname: string) {
  const route = parseTripPath(pathname);

  if (route.view === "journey" && route.essentials) {
    return document.getElementById("essentials");
  }

  if (route.view === "day") {
    const section = document.getElementById(`day-${route.dayId}`);
    const beatId = route.detail
      ? beatIdForDetail(route.dayId, route.detail)
      : null;
    const beat = beatId
      ? section?.querySelector<HTMLElement>(`[data-beat="${beatId}"]`)
      : null;
    return beat ?? section;
  }

  if (route.view === "journey" && route.destination) {
    const destination = getDestination(route.destination);
    if (destination) {
      return document.getElementById(`day-${destination.dayIds[0]}`);
    }
  }

  return null;
}

/** Smooth 0..1 ease, used for the day handoff so it decelerates instead of snapping. */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

type DaySectionFrame = {
  section: HTMLElement;
  progress: string;
  exit: string;
  railH: string;
  railClipTop: string;
};

type DaysFrame = {
  sections: DaySectionFrame[];
  activeDay: number;
  itineraryMode: boolean;
};

export function TripShell() {
  const pathname = usePathname();
  const mapRef = useRef<JourneyMapHandle | null>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const lastLabel = useRef("");
  const lastHeaderHeight = useRef<number | null>(null);
  const dayStyleCache = useRef<WeakMap<HTMLElement, DaySectionFrame>>(
    new WeakMap(),
  );
  const ticking = useRef(false);
  const previousPath = useRef<string | null>(null);
  const activeDayRef = useRef<number | null>(null);
  const itineraryModeRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeDayId, setActiveDayId] = useState<number>(days[0].id);
  const [itineraryMode, setItineraryMode] = useState(false);

  /** Mirrors the 100svh map stage instead of Safari's animated visual viewport. */
  const getStableViewportHeight = useCallback(
    () => mapStageRef.current?.clientHeight ?? window.innerHeight,
    [],
  );

  /**
   * Header height only changes on resize or brand/day cross-fade — both are
   * covered by the ResizeObserver below, so this never runs on the scroll
   * path. Cached so a same-value resize doesn't touch the DOM.
   */
  const syncChrome = useCallback(() => {
    const header = headerRef.current;
    if (!header) return;
    const height = Math.round(header.getBoundingClientRect().height);
    if (lastHeaderHeight.current === height) return;
    lastHeaderHeight.current = height;
    document.documentElement.style.setProperty(
      "--trip-header-height",
      `${height}px`,
    );
  }, []);

  /** The hero and day sections are static, so they are queried once per layout. */
  const collectSections = useCallback(() => {
    heroRef.current = document.getElementById("hero");
    sectionsRef.current = [
      ...document.querySelectorAll<HTMLElement>("[data-day]"),
    ];
  }, []);

  /** Pure layout reads, no writes. Feeds paintDays. */
  const measureDays = useCallback(
    (headerHeight: number, viewportHeight: number): DaysFrame | null => {
      const sections = sectionsRef.current;
      if (sections.length === 0) return null;

      // Same anchor line the rail fill, exit fade, and active-day pointer all
      // read from — one line, three consumers.
      const dayAnchor =
        headerHeight + Math.min(viewportHeight * DAY_ANCHOR_VH, DAY_ANCHOR_MAX_PX);
      const fadeStart =
        headerHeight +
        Math.min(viewportHeight * DAY_FADE_START_VH, DAY_FADE_START_MAX_PX);
      const fadeEnd = dayAnchor;

      const rects = sections.map((section) => section.getBoundingClientRect());
      const railStarts = sections.map((section, index) => {
        const offset = Number(section.dataset.railStart);
        return rects[index].top + (Number.isFinite(offset) ? offset : 0);
      });
      const railEnds = sections.map((section, index) => {
        const offset = Number(section.dataset.railEnd);
        return rects[index].top +
          (Number.isFinite(offset) ? offset : rects[index].height);
      });
      const titleDotCenters = sections.map((section, index) => {
        const dot = section.querySelector<HTMLElement>(".day-title-origin");
        if (!dot) return railStarts[index];
        const rect = dot.getBoundingClientRect();
        return (rect.top + rect.bottom) / 2;
      });
      let activeDay = Number(sections[0].dataset.day) || days[0].id;

      const frames = sections.map((section, index) => {
        const railStart = railStarts[index];
        const railSpan = Math.max(railEnds[index] - railStart, 1);
        const nextRailStart = railStarts[index + 1];
        // The visible rail belongs only to this day's authored markers. Day
        // activation still hands off at the next title, but the track and its
        // fill stop at the final beat instead of growing a decorative tail.
        const progress = clamp((dayAnchor - railStart) / railSpan);
        // The title is sticky while the rail is section-relative. Clip away
        // the portion the sticky dot has passed so no line appears above it.
        const railClipTop = clamp(
          titleDotCenters[index] - railStart,
          0,
          railSpan,
        );

        const exitRaw =
          nextRailStart === undefined
            ? 0
            : clamp(
                (fadeStart - nextRailStart) /
                  Math.max(fadeStart - fadeEnd, 1),
              );
        const exit = smoothstep(0, 1, exitRaw);

        if (railStart <= dayAnchor) {
          activeDay = Number(section.dataset.day) || activeDay;
        }

        return {
          section,
          progress: progress.toFixed(4),
          exit: exit.toFixed(4),
          railH: `${Math.round(railSpan)}px`,
          railClipTop: `${Math.round(railClipTop)}px`,
        };
      });

      const firstRect = rects[0];
      const lastRect = rects[rects.length - 1];
      const itineraryMode =
        firstRect.top <= headerHeight + 8 && lastRect.bottom > headerHeight + 8;

      return { sections: frames, activeDay, itineraryMode };
    },
    [],
  );

  /** Writes only. Skips a section entirely when nothing it owns has changed. */
  const paintDays = useCallback((frame: DaysFrame) => {
    const cache = dayStyleCache.current;
    for (const next of frame.sections) {
      const prev = cache.get(next.section);
      if (prev === undefined) cache.set(next.section, next);
      const style = next.section.style;
      if (!prev || prev.progress !== next.progress) {
        style.setProperty("--day-progress", next.progress);
      }
      if (!prev || prev.exit !== next.exit) {
        style.setProperty("--day-exit", next.exit);
      }
      if (!prev || prev.railH !== next.railH) {
        style.setProperty("--day-rail-h", next.railH);
      }
      if (!prev || prev.railClipTop !== next.railClipTop) {
        style.setProperty("--day-rail-clip-top", next.railClipTop);
      }
      cache.set(next.section, next);
    }
  }, []);

  /** Measure everything, then paint everything — one layout per frame instead of several. */
  const syncAll = useCallback(() => {
    if (sectionsRef.current.length === 0) collectSections();
    const viewportHeight = getStableViewportHeight();
    const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 0;

    // --- measure ---
    const dayFrame = measureDays(headerHeight, viewportHeight);
    const view = readJourneyView(
      heroRef.current,
      sectionsRef.current,
      viewportHeight,
    );

    // --- paint ---
    if (dayFrame) {
      paintDays(dayFrame);
      if (activeDayRef.current !== dayFrame.activeDay) {
        activeDayRef.current = dayFrame.activeDay;
        setActiveDayId(dayFrame.activeDay);
      }
      if (itineraryModeRef.current !== dayFrame.itineraryMode) {
        itineraryModeRef.current = dayFrame.itineraryMode;
        setItineraryMode(dayFrame.itineraryMode);
      }
    }
    mapRef.current?.setView(view);
    if (labelRef.current && view.label !== lastLabel.current) {
      lastLabel.current = view.label;
      labelRef.current.textContent = view.label;
    }
  }, [collectSections, getStableViewportHeight, measureDays, paintDays]);

  useLayoutEffect(() => {
    collectSections();
    syncChrome();
    syncAll();
  }, [collectSections, syncChrome, syncAll]);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        try {
          syncAll();
        } finally {
          ticking.current = false;
        }
      });
    };
    const onStableViewportResize = () => {
      collectSections();
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

    const mapStage = mapStageRef.current;
    const viewportObserver =
      mapStage && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onStableViewportResize)
        : null;
    if (mapStage && viewportObserver) viewportObserver.observe(mapStage);

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      headerObserver?.disconnect();
      viewportObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [collectSections, syncChrome, syncAll]);

  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    const target = targetForPath(pathname);

    const afterScroll = () => {
      requestAnimationFrame(() => {
        syncChrome();
        syncAll();
      });
    };

    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      afterScroll();
      return;
    }

    if (previous && previous !== "/" && pathname === "/") {
      window.scrollTo({ top: 0, behavior: "auto" });
      afterScroll();
    }
  }, [pathname, syncChrome, syncAll]);

  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0];

  return (
    <div className="relative">
      <nav aria-label="Skip links">
        <a
          href="#itinerary"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--paper)] focus:px-3 focus:py-2"
        >
          Skip to itinerary
        </a>
        <a
          href="#essentials"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-50 focus:bg-[var(--paper)] focus:px-3 focus:py-2"
        >
          Skip to essentials
        </a>
      </nav>

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

      <header ref={headerRef} className="trip-header">
        <div className="trip-header-inner">
          <div
            className="trip-header-brand"
            aria-hidden={itineraryMode}
            data-visible={!itineraryMode}
          >
            <Link
              href="/"
              aria-label="Europe 2026, back to the start"
              tabIndex={itineraryMode ? -1 : undefined}
              className="pointer-events-auto min-w-0 rounded-sm"
            >
              <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--trail-ink)]">
                {trip.eyebrow}
              </span>
              <span className="font-display mt-0.5 block text-[22px] leading-none [font-variation-settings:'WONK'_0.7,'opsz'_22] sm:text-[24px]">
                {trip.title}
              </span>
            </Link>
            <p
              ref={labelRef}
              aria-hidden="true"
              className="max-w-[46%] text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink)] sm:text-[11px]"
            >
              The route
            </p>
          </div>

          <div
            className="trip-header-day"
            aria-hidden={!itineraryMode}
            data-visible={itineraryMode}
          >
            <p className="trip-header-day-number font-display overlay-type">
              Day {activeDay.id}
            </p>
            <div className="trip-header-day-meta overlay-type">
              <time dateTime={activeDay.isoDate}>
                {activeDay.weekday} · {activeDay.monthDay}
              </time>
              <span>{activeDay.title}</span>
            </div>
            <p className="trip-header-day-summary overlay-type">
              {activeDay.summary}
            </p>
          </div>
        </div>
      </header>

      <nav
        aria-label={`Trip days, ${days.length} total`}
        aria-hidden={!itineraryMode}
        className="day-dots"
        data-visible={itineraryMode}
      >
        {days.map((day) => {
          const isActive = itineraryMode && activeDay.id === day.id;
          return (
            <a
              key={day.id}
              href={`#day-${day.id}`}
              aria-label={`Day ${day.id}: ${day.title}`}
              aria-current={isActive ? "step" : undefined}
              tabIndex={itineraryMode ? undefined : -1}
              className="day-dot"
              data-active={isActive}
            >
              <span>{day.id}</span>
            </a>
          );
        })}
      </nav>

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
