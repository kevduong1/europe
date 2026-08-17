import type { Day } from "@/data/types";
import { cn } from "@/lib/utils";
import { Timeline } from "./timeline";

function DayCopy({
  day,
  includeTimeline,
}: {
  day: Day;
  includeTimeline: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-28">
      <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
        Day {day.id} · {day.weekday}, {day.monthDay}
      </p>
      <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08] [font-variation-settings:'WONK'_0.8,'opsz'_32]">
        {day.title}
      </h2>
      <p className="overlay-type mt-3 max-w-[32em] text-[16px] leading-relaxed text-[var(--ink)]">
        {day.summary}
      </p>
      {includeTimeline ? (
        <div className="mt-8">
          <Timeline day={day} />
        </div>
      ) : null}
      {includeTimeline && day.practical.length > 0 ? (
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
  );
}

export function DaySection({ day }: { day: Day }) {
  const isOutboundFlight = day.id === 1;

  return (
    <section
      id={`day-${day.id}`}
      data-day={day.id}
      className={cn(
        "relative flex scroll-mt-24 flex-col",
        isOutboundFlight ? "min-h-[280dvh]" : "min-h-[100dvh]",
      )}
    >
      <div className="flex min-h-[100dvh] flex-col justify-end">
        <DayCopy day={day} includeTimeline={isOutboundFlight} />
      </div>
      {isOutboundFlight ? (
        <div
          data-flight-leg="out"
          className="min-h-[180dvh] flex-1"
          aria-hidden="true"
        />
      ) : (
        <div className="mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <Timeline day={day} />
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
      )}
    </section>
  );
}
