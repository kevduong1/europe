"use client";

import { useLayoutEffect, useRef } from "react";
import type { Day } from "@/lib/engine/types";
import { Timeline } from "./timeline";

export function DaySection({ day }: { day: Day }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const head = headRef.current;
    const title = titleRef.current;
    if (!section || !content || !head || !title) return;

    const apply = () => {
      section.style.setProperty("--day-head-h", `${head.offsetHeight}px`);
      const dotFromHead = title.offsetTop + title.offsetHeight / 2;
      section.style.setProperty("--day-dot-from-head", `${dotFromHead}px`);
      section.dataset.dotFromHead = `${dotFromHead}`;
      const railStart =
        content.offsetTop + head.offsetTop + dotFromHead;
      const roundedRailStart = Math.round(railStart);
      section.style.setProperty("--day-rail-start", `${roundedRailStart}px`);
      section.dataset.railStart = `${roundedRailStart}`;
      // Hold the sticky track through the last beat's scroll box, not just to
      // its marker — otherwise the rail unsticks and slides off the top while
      // this day is still active.
      section.dataset.railEnd = `${Math.round(section.offsetHeight)}`;
    };

    const observer = new ResizeObserver(apply);
    observer.observe(head);
    observer.observe(content);
    observer.observe(section);
    apply();
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={`day-${day.id}`}
      data-day={day.id}
      className="day-section relative flex scroll-mt-[var(--trip-header-height)] flex-col"
    >
      <div className="day-rail" aria-hidden="true">
        <div className="day-rail-track">
          <div className="day-rail-fill" />
        </div>
      </div>

      {day.id === 1 ? (
        <div className="h-8 shrink-0" aria-hidden="true" />
      ) : null}

      <div
        ref={contentRef}
        className="day-content mx-auto w-full max-w-[640px] px-6 pb-6"
      >
        <div ref={headRef} className="day-head pl-10">
          <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail-ink)]">
            {day.weekday}, {day.monthDay}
          </p>
          <h2
            ref={titleRef}
            className="overlay-type font-display relative mt-2 text-[32px] leading-[1.08] [font-variation-settings:'WONK'_0.8,'opsz'_32]"
          >
            <span className="day-title-origin" aria-hidden="true" />
            Day {day.id}
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
