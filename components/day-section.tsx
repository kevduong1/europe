"use client";

import { useLayoutEffect, useRef } from "react";
import type { Day } from "@/data/types";
import { Timeline } from "./timeline";

export function DaySection({ day }: { day: Day }) {
  const isOutboundFlight = day.id === 1;
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const head = headRef.current;
    if (!section || !head) return;

    const apply = () => {
      section.style.setProperty("--day-head-h", `${head.offsetHeight}px`);
    };

    const observer = new ResizeObserver(apply);
    observer.observe(head);
    apply();
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={`day-${day.id}`}
      data-day={day.id}
      className="relative flex scroll-mt-[var(--trip-header-height)] flex-col"
    >
      <div className="h-[calc(100dvh-18rem)] min-h-[36dvh] shrink-0" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div ref={headRef} className="day-head pl-10">
          <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
            Day {day.id} · {day.weekday}, {day.monthDay}
          </p>
          <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08] [font-variation-settings:'WONK'_0.8,'opsz'_32]">
            {day.title}
          </h2>
          <p className="overlay-type mt-3 max-w-[32em] text-[16px] leading-relaxed text-[var(--ink)]">
            {day.summary}
          </p>
        </div>

        <div className="mt-8">
          <Timeline day={day} />
        </div>

        {isOutboundFlight ? (
          <div
            data-flight-leg="out"
            className="min-h-[180dvh]"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </section>
  );
}
