"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { days, getDay, trip } from "@/data/trip";
import { dayHref, destinationHref, parseTripPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { DayStrip } from "./day-strip";
import { DestinationSheet } from "./destination-sheet";
import { DestinationTeasers } from "./destination-teasers";
import { DetailSheet } from "./detail-sheet";
import { EssentialsSheet } from "./essentials-sheet";
import { Chevron, RouteGlyph } from "./icons";
import type { JourneyMapHandle } from "./journey-map";
import { RegisterSw } from "./register-sw";
import { Timeline } from "./timeline";

const JourneyMap = dynamic(
  () => import("./journey-map").then((mod) => mod.JourneyMap),
  { ssr: false },
);

type Background =
  | { view: "journey" }
  | { view: "day"; dayId: number };

export function TripShell() {
  const pathname = usePathname();
  const router = useRouter();
  const route = parseTripPath(pathname);
  const mapRef = useRef<JourneyMapHandle | null>(null);
  const firstCamera = useRef(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [stripOpen, setStripOpen] = useState(false);
  const [scrub, setScrub] = useState(0);
  const [pathEpoch, setPathEpoch] = useState(pathname);
  const [underlay, setUnderlay] = useState<Background>({ view: "journey" });
  const pointerRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    mode: "none" | "scrub" | "pull";
  }>({ x: 0, y: 0, active: false, mode: "none" });

  if (pathEpoch !== pathname) {
    setPathEpoch(pathname);
    setMapExpanded(false);
    setStripOpen(false);
    setScrub(0);
  }

  if (route.view === "day") {
    if (underlay.view !== "day" || underlay.dayId !== route.dayId) {
      setUnderlay({ view: "day", dayId: route.dayId });
    }
  } else if (!route.destination && !route.essentials && underlay.view !== "journey") {
    setUnderlay({ view: "journey" });
  }

  const overlayDestination = route.view === "journey" ? route.destination : undefined;
  const overlayEssentials = route.view === "journey" ? route.essentials : undefined;
  const overlayDetail = route.view === "day" ? route.detail : undefined;

  const display = useMemo<Background>(() => {
    if (overlayDestination || overlayEssentials) return underlay;
    if (route.view === "day") return { view: "day", dayId: route.dayId };
    return { view: "journey" };
  }, [overlayDestination, overlayEssentials, route, underlay]);

  const day = display.view === "day" ? getDay(display.dayId) : undefined;
  const isJourney = display.view === "journey";

  useEffect(() => {
    mapRef.current?.resize();
  }, [isJourney, mapExpanded, day?.id]);

  useEffect(() => {
    if (!mapReady) return;
    const alongRoute = !firstCamera.current;
    const draw = firstCamera.current && isJourney;
    firstCamera.current = false;
    if (isJourney) {
      mapRef.current?.showJourney({ draw });
      return;
    }
    if (day) {
      mapRef.current?.showDay(day.id, day.mapFrame, { alongRoute });
    }
  }, [mapReady, isJourney, day]);

  const closeOverlay = useCallback(() => {
    if (display.view === "day") router.replace(dayHref(display.dayId));
    else router.replace("/");
  }, [display, router]);

  const goDay = useCallback(
    (id: number) => {
      setStripOpen(false);
      router.push(dayHref(id));
    },
    [router],
  );

  const adjacent = (dir: -1 | 1) => {
    if (!day) return;
    const next = getDay(day.id + dir);
    if (next) goDay(next.id);
  };

  function onHeaderPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (isJourney || mapExpanded) return;
    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      active: true,
      mode: "none",
    };
  }

  function onHeaderPointerMove(event: React.PointerEvent<HTMLElement>) {
    const pointer = pointerRef.current;
    if (!pointer.active || !day) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (pointer.mode === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      pointer.mode = Math.abs(dx) >= Math.abs(dy) ? "scrub" : "pull";
    }
    if (pointer.mode === "pull") {
      if (dy > 48) setStripOpen(true);
      return;
    }
    const width = event.currentTarget.offsetWidth || 1;
    const raw = -dx / width;
    const atStart = day.id === 1 && raw < 0;
    const atEnd = day.id === 10 && raw > 0;
    const progress = atStart || atEnd ? raw * 0.18 : raw;
    setScrub(progress);
    const from = day.mapFrame;
    const target = getDay(progress > 0 ? day.id + 1 : day.id - 1);
    if (target) {
      mapRef.current?.setScrub(from, target.mapFrame, Math.min(1, Math.abs(progress)));
    }
  }

  function onHeaderPointerUp() {
    const pointer = pointerRef.current;
    pointer.active = false;
    if (!day || pointer.mode !== "scrub") {
      pointer.mode = "none";
      return;
    }
    pointer.mode = "none";
    if (Math.abs(scrub) >= 0.3) {
      const next = getDay(day.id + (scrub > 0 ? 1 : -1));
      if (next) {
        goDay(next.id);
        return;
      }
    }
    mapRef.current?.showDay(day.id, day.mapFrame, { alongRoute: false });
    setScrub(0);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col bg-[var(--paper)]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--paper)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header
        className={cn(
          day && !mapExpanded && "sticky top-0 z-20 bg-[var(--paper)] touch-none",
        )}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        {isJourney ? (
          <div className="px-5 pb-3 pt-8 sm:pt-12">
            <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
              {trip.eyebrow}
            </p>
            <h1 className="font-display mt-2 text-[34px] leading-[1.1] [font-variation-settings:'WONK'_1,'SOFT'_20,'opsz'_34]">
              {trip.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-1 text-[13px] text-[var(--dolomite)]">
              <span>Munich</span>
              <RouteGlyph mode="rail" />
              <span>Innsbruck</span>
              <RouteGlyph mode="trail" />
              <span>the Dolomites</span>
              <RouteGlyph mode="water" />
              <span>Venice</span>
            </p>
          </div>
        ) : null}

        <div
          className={cn(
            "relative overflow-hidden bg-[var(--paper)]",
            mapExpanded
              ? "fixed inset-0 z-40 h-dvh"
              : isJourney
                ? "h-[62vh] min-h-[280px]"
                : "h-[35vh] min-h-[180px]",
            !mapExpanded && "transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          )}
        >
          <JourneyMap
            ref={mapRef}
            interactive={isJourney || mapExpanded}
            onDestination={(slug) => router.push(destinationHref(slug))}
            onExpand={() => setMapExpanded(true)}
            onReady={() => setMapReady(true)}
          />
          {day && !mapExpanded ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 p-2 text-[var(--ink)]"
                aria-label="Previous day"
                disabled={day.id === 1}
                onClick={() => adjacent(-1)}
              >
                <Chevron direction="left" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 p-2 text-[var(--ink)]"
                aria-label="Next day"
                disabled={day.id === 10}
                onClick={() => adjacent(1)}
              >
                <Chevron direction="right" />
              </button>
              <button
                type="button"
                onClick={() => setStripOpen(true)}
                className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink)]"
                aria-label="Open day strip"
              >
                Day {day.id} / {days.length} · {day.stripLabel}
              </button>
            </>
          ) : null}
          {mapExpanded ? (
            <div
              className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-4 pt-4"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                event.currentTarget.dataset.y = String(event.clientY);
              }}
              onPointerUp={(event) => {
                const start = Number(event.currentTarget.dataset.y ?? event.clientY);
                if (event.clientY - start > 72) setMapExpanded(false);
              }}
            >
              <div className="mt-1 h-1 w-10 rounded-full bg-[var(--dolomite)]/50" />
              <button
                type="button"
                onClick={() => setMapExpanded(false)}
                className="bg-[var(--paper)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em]"
              >
                Close map
              </button>
            </div>
          ) : null}
        </div>

        {isJourney ? <DayStrip /> : null}

        {day ? (
          <div
            className="px-5 pb-4 pt-5"
            style={{
              transform: scrub ? `translateX(${-scrub * 28}%)` : undefined,
              opacity: scrub ? 1 - Math.min(0.45, Math.abs(scrub)) : 1,
            }}
          >
            <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
              Day {day.id} · {day.weekday}, {day.monthDay}
            </p>
            <h1 className="font-display mt-2 text-[28px] leading-[1.1] [font-variation-settings:'WONK'_0.8,'opsz'_28]">
              {day.title}
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[color-mix(in_srgb,var(--ink)_78%,var(--paper))]">
              {day.summary}
            </p>
          </div>
        ) : null}
      </header>

      <main id="content" className="flex-1">
        {isJourney ? (
          <div className="px-0 pb-16">
            <p className="px-5 py-10 text-[16px] leading-relaxed text-[color-mix(in_srgb,var(--ink)_82%,var(--paper))]">
              {trip.editorial}
            </p>
            <DestinationTeasers />
            <footer className="px-5 pt-10">
              <Link
                href="/essentials"
                className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--lagoon)]"
              >
                Essentials
              </Link>
            </footer>
          </div>
        ) : null}

        {day ? (
          <div className="px-5 pb-20 pt-2">
            <Timeline day={day} />
            {day.practical.length > 0 ? (
              <details className="mt-12 border-t border-[var(--ink)]/10 pt-4">
                <summary className="cursor-pointer font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
                  Details for this day
                </summary>
                <ul className="mt-4 space-y-3">
                  {day.practical.map((item) => (
                    <li
                      key={item.text}
                      className={cn(
                        "text-[16px] leading-relaxed",
                        item.todo && "text-[var(--signal)]",
                      )}
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <details className="mt-12 border-t border-[var(--ink)]/10 pt-4">
                <summary className="cursor-pointer font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
                  Details for this day
                </summary>
                <p className="mt-4 text-[16px] leading-relaxed text-[var(--dolomite)]">
                  Nothing extra for this day.
                </p>
              </details>
            )}
          </div>
        ) : null}
      </main>

      {stripOpen && day ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close day strip"
            className="absolute inset-0 bg-[rgba(31,36,33,0.45)]"
            onClick={() => setStripOpen(false)}
          />
          <div className="relative bg-[var(--paper)] pt-8 shadow-[0_-8px_32px_rgba(31,36,33,0.10)]">
            <DayStrip activeDayId={day.id} onSelect={goDay} />
          </div>
        </div>
      ) : null}

      {overlayDetail && day ? (
        <DetailSheet dayId={day.id} slug={overlayDetail} onClose={closeOverlay} />
      ) : null}
      {overlayDestination ? (
        <DestinationSheet slug={overlayDestination} onClose={closeOverlay} />
      ) : null}
      {overlayEssentials ? <EssentialsSheet onClose={closeOverlay} /> : null}
      <RegisterSw />
    </div>
  );
}
