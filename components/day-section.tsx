"use client";

import { useLayoutEffect, useRef } from "react";
import type { Day } from "@/data/types";
import { Timeline } from "./timeline";

export function DaySection({ day }: { day: Day }) {
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
      {day.id === 1 ? (
        <div className="h-8 shrink-0" aria-hidden="true" />
      ) : null}

      <div className="mx-auto w-full max-w-[640px] px-6 pb-6">
        <div ref={headRef} className="day-head pl-10">
          <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail-ink)]">
            Day {day.id} · {day.weekday}, {day.monthDay}
          </p>
          <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08] [font-variation-settings:'WONK'_0.8,'opsz'_32]">
            {day.title}
          </h2>
          <p className="overlay-type mt-3 max-w-[32em] text-[16px] leading-relaxed text-[var(--ink)]">
            {day.summary}
          </p>
        </div>

        {day.practical.length > 0 ? (
          <ul className="mt-6 space-y-2 pl-10">
            {day.practical.map((item) => (
              <li
                key={item.text}
                className="overlay-type text-[15px] leading-relaxed text-[var(--dolomite)]"
              >
                {item.todo ? (
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--signal)]">
                    To do ·{" "}
                  </span>
                ) : null}
                {item.text}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8">
          <Timeline day={day} />
        </div>
      </div>
    </section>
  );
}
