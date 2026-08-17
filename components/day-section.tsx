import type { Day } from "@/data/types";
import { cn } from "@/lib/utils";
import { Timeline } from "./timeline";

export function DaySection({ day }: { day: Day }) {
  return (
    <section
      id={`day-${day.id}`}
      data-day={day.id}
      className="relative flex min-h-[100dvh] scroll-mt-4 flex-col justify-end"
    >
      <div className="overlay-panel mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-28">
        <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
          Day {day.id} · {day.weekday}, {day.monthDay}
        </p>
        <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08] [font-variation-settings:'WONK'_0.8,'opsz'_32]">
          {day.title}
        </h2>
        <p className="overlay-type mt-3 max-w-[32em] text-[16px] leading-relaxed text-[var(--ink)]">
          {day.summary}
        </p>
        <div className="mt-8">
          <Timeline day={day} />
        </div>
        {day.practical.length > 0 ? (
          <ul className="mt-8 space-y-2">
            {day.practical.map((item) => (
              <li
                key={item.text}
                className={cn(
                  "overlay-type text-[15px] leading-relaxed",
                  item.todo && "text-[var(--signal)]",
                )}
              >
                {item.text}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
