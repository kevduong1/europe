import Link from "next/link";
import type { RefObject } from "react";
import type { Day } from "@/lib/engine/types";
import { trip } from "@/trip";

export function TripHeader({
  headerRef,
  labelRef,
  itineraryMode,
  activeDay,
}: {
  headerRef: RefObject<HTMLElement | null>;
  labelRef: RefObject<HTMLParagraphElement | null>;
  itineraryMode: boolean;
  activeDay: Day;
}) {
  return (
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
          <div className="trip-header-day-copy overlay-type">
            <p className="trip-header-day-title font-display">{activeDay.title}</p>
            <time dateTime={activeDay.isoDate}>
              {activeDay.weekday} · {activeDay.monthDay}
            </time>
          </div>
          <p className="trip-header-day-summary overlay-type">
            {activeDay.summary}
          </p>
        </div>
      </div>
    </header>
  );
}
