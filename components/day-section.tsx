"use client";

import { useLayoutEffect, useRef } from "react";
import type { Day } from "@/data/types";
import { Timeline } from "./timeline";

function offsetTopWithin(element: HTMLElement, ancestor: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current && current !== ancestor) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

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
      const railStart =
        content.offsetTop +
        head.offsetTop +
        title.offsetTop +
        title.offsetHeight / 2;
      const roundedRailStart = Math.round(railStart);
      section.style.setProperty("--day-rail-start", `${roundedRailStart}px`);
      section.dataset.railStart = `${roundedRailStart}`;

      const stops = section.querySelectorAll<HTMLElement>(".day-rail-stop");
      const lastStop = stops.item(stops.length - 1);
      const railEnd = lastStop
        ? offsetTopWithin(lastStop, section) + lastStop.offsetHeight / 2
        : railStart;
      section.dataset.railEnd = `${Math.round(railEnd)}`;
    };

    const observer = new ResizeObserver(apply);
    observer.observe(head);
    observer.observe(content);
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
            Day {day.id} · {day.weekday}, {day.monthDay}
          </p>
          <h2
            ref={titleRef}
            className="overlay-type font-display relative mt-2 text-[32px] leading-[1.08] [font-variation-settings:'WONK'_0.8,'opsz'_32]"
          >
            <span className="day-title-origin" aria-hidden="true" />
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
