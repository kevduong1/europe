"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { clamp } from "@/lib/engine/geo";
import {
  DAY_ANCHOR_MAX_PX,
  DAY_ANCHOR_VH,
  DAY_FADE_START_MAX_PX,
  DAY_FADE_START_VH,
} from "@/lib/engine/pacing";
import { readJourneyView } from "@/lib/engine/scroll";
import { days, registry } from "@/trip";
import type { JourneyMapHandle } from "../map/journey-map";

type DaySectionFrame = {
  section: HTMLElement;
  progress: string;
  exit: string;
  railH: string;
  railVisibleH: string;
};

type DaysFrame = {
  sections: DaySectionFrame[];
  activeDay: number;
  itineraryMode: boolean;
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const progress = clamp((value - edge0) / (edge1 - edge0));
  return progress * progress * (3 - 2 * progress);
}

function measureDays(
  sections: HTMLElement[],
  headerHeight: number,
  viewportHeight: number,
): DaysFrame | null {
  if (sections.length === 0) return null;
  const dayAnchor =
    headerHeight + Math.min(viewportHeight * DAY_ANCHOR_VH, DAY_ANCHOR_MAX_PX);
  const fadeStart =
    headerHeight +
    Math.min(viewportHeight * DAY_FADE_START_VH, DAY_FADE_START_MAX_PX);
  const rects = sections.map((section) => section.getBoundingClientRect());
  const railStarts = sections.map((section, index) => {
    const offset = Number(section.dataset.railStart);
    return rects[index].top + (Number.isFinite(offset) ? offset : 0);
  });
  const railEnds = sections.map((section, index) => {
    const offset = Number(section.dataset.railEnd);
    return (
      rects[index].top +
      (Number.isFinite(offset) ? offset : rects[index].height)
    );
  });
  let activeDay = Number(sections[0].dataset.day) || days[0].id;

  const frames = sections.map((section, index) => {
    const railStart = railStarts[index];
    const railEnd = railEnds[index];
    const railSpan = Math.max(railEnd - railStart, 1);
    const dotFromHead = Number(section.dataset.dotFromHead);
    const pin = headerHeight + (Number.isFinite(dotFromHead) ? dotFromHead : 0);
    const visualTop = Math.max(railStart, pin);
    const visibleH = Math.max(
      0,
      Math.min(viewportHeight - pin, railEnd - visualTop),
    );
    const progress =
      visibleH > 0
        ? clamp((dayAnchor - visualTop) / Math.max(visibleH, 1))
        : 0;
    const nextRailStart = railStarts[index + 1];
    const exitRaw =
      nextRailStart === undefined
        ? 0
        : clamp((fadeStart - nextRailStart) / Math.max(fadeStart - dayAnchor, 1));
    const exit = smoothstep(0, 1, exitRaw);
    if (railStart <= dayAnchor) {
      activeDay = Number(section.dataset.day) || activeDay;
    }
    return {
      section,
      progress: progress.toFixed(4),
      exit: exit.toFixed(4),
      railH: `${Math.round(railSpan)}px`,
      railVisibleH: `${Math.round(visibleH)}px`,
    };
  });

  return {
    sections: frames,
    activeDay,
    itineraryMode:
      rects[0].top <= headerHeight + 8 &&
      rects[rects.length - 1].bottom > headerHeight + 8,
  };
}

function paintDays(
  frame: DaysFrame,
  cache: WeakMap<HTMLElement, DaySectionFrame>,
) {
  for (const next of frame.sections) {
    const previous = cache.get(next.section);
    const style = next.section.style;
    if (!previous || previous.progress !== next.progress) {
      style.setProperty("--day-progress", next.progress);
    }
    if (!previous || previous.exit !== next.exit) {
      style.setProperty("--day-exit", next.exit);
    }
    if (!previous || previous.railH !== next.railH) {
      style.setProperty("--day-rail-h", next.railH);
    }
    if (!previous || previous.railVisibleH !== next.railVisibleH) {
      style.setProperty("--day-rail-visible-h", next.railVisibleH);
    }
    cache.set(next.section, next);
  }
}

export function useScrollSync() {
  const mapRef = useRef<JourneyMapHandle | null>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const lastLabel = useRef("");
  const lastHeaderHeight = useRef<number | null>(null);
  const dayStyleCache = useRef(new WeakMap<HTMLElement, DaySectionFrame>());
  const ticking = useRef(false);
  const activeDayRef = useRef<number | null>(null);
  const itineraryModeRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeDayId, setActiveDayId] = useState(days[0].id);
  const [itineraryMode, setItineraryMode] = useState(false);

  const syncChrome = useCallback(() => {
    const header = headerRef.current;
    if (!header) return;
    const height = Math.round(header.getBoundingClientRect().height);
    if (lastHeaderHeight.current === height) return;
    lastHeaderHeight.current = height;
    document.documentElement.style.setProperty("--trip-header-height", `${height}px`);
  }, []);

  const collectSections = useCallback(() => {
    heroRef.current = document.getElementById("hero");
    sectionsRef.current = [
      ...document.querySelectorAll<HTMLElement>("[data-day]"),
    ];
  }, []);

  const syncAll = useCallback(() => {
    if (sectionsRef.current.length === 0) collectSections();
    const viewportHeight = mapStageRef.current?.clientHeight ?? window.innerHeight;
    const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 0;
    const dayFrame = measureDays(
      sectionsRef.current,
      headerHeight,
      viewportHeight,
    );
    const view = readJourneyView(
      registry,
      heroRef.current,
      sectionsRef.current,
      viewportHeight,
    );
    if (dayFrame) {
      paintDays(dayFrame, dayStyleCache.current);
      const nextActiveDay = view.dayId ?? dayFrame.activeDay;
      if (activeDayRef.current !== nextActiveDay) {
        activeDayRef.current = nextActiveDay;
        setActiveDayId(nextActiveDay);
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
  }, [collectSections]);

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
    const headerObserver = headerRef.current
      ? new ResizeObserver(syncChrome)
      : null;
    if (headerRef.current) headerObserver?.observe(headerRef.current);
    const viewportObserver = mapStageRef.current
      ? new ResizeObserver(onStableViewportResize)
      : null;
    if (mapStageRef.current) viewportObserver?.observe(mapStageRef.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      headerObserver?.disconnect();
      viewportObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [collectSections, syncChrome, syncAll]);

  return {
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
  };
}
