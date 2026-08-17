"use client";

import Link from "next/link";
import { days } from "@/data/trip";
import { dayHref } from "@/lib/paths";
import { cn } from "@/lib/utils";

type DayStripProps = {
  activeDayId?: number;
  onSelect?: (dayId: number) => void;
};

export function DayStrip({ activeDayId, onSelect }: DayStripProps) {
  return (
    <div className="relative">
      <div
        className="flex gap-0 overflow-x-auto px-2 pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Days of the trip"
      >
        {days.map((day) => {
          const active = day.id === activeDayId;
          const inner = (
            <>
              <span className="font-mono text-[13px] font-medium tracking-[0.06em]">
                {day.id}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
                {day.weekdayInitial}
              </span>
              <span className="mt-1 text-[12px] leading-tight text-[var(--ink)]">
                {day.stripLabel}
              </span>
            </>
          );

          return (
            <div
              key={day.id}
              role="listitem"
              className={cn(
                "min-w-[4.4rem] flex-1",
                day.isHikeDay && "bg-[color-mix(in_srgb,var(--meadow)_14%,var(--paper))]",
              )}
            >
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(day.id)}
                  className={cn(
                    "flex w-full flex-col items-center px-1 py-2 text-center",
                    active && "text-[var(--ink)]",
                  )}
                  aria-current={active ? "true" : undefined}
                >
                  {inner}
                </button>
              ) : (
                <Link
                  href={dayHref(day.id)}
                  className={cn(
                    "flex w-full flex-col items-center px-1 py-2 text-center",
                    active && "text-[var(--ink)]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {inner}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
