import Image from "next/image";
import { photos } from "@/data/photos";
import type { Day } from "@/data/types";
import { cn } from "@/lib/utils";
import { Timeline } from "./timeline";

const photosByDay: Partial<Record<number, keyof typeof photos>> = {
  2: "munich",
  4: "innsbruck",
  5: "ortisei",
  6: "dolomites",
  7: "puez",
  9: "venice",
};

export function DaySection({ day }: { day: Day }) {
  const photoKey = photosByDay[day.id];
  const photo = photoKey ? photos[photoKey] : null;

  return (
    <section
      id={`day-${day.id}`}
      data-day={day.id}
      className="relative flex min-h-[100dvh] scroll-mt-4 flex-col justify-end"
    >
      <article
        className={cn(
          "mx-auto mb-[max(12px,env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] max-w-[560px] overflow-hidden rounded-2xl bg-[var(--paper)] shadow-[0_12px_40px_rgba(31,36,33,0.14)]",
        )}
      >
        {photo ? (
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 100vw, 560px"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="px-5 pb-6 pt-5">
          <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
            Day {day.id} · {day.weekday}, {day.monthDay}
          </p>
          <h2 className="font-display mt-2 text-[28px] leading-[1.1] [font-variation-settings:'WONK'_0.8,'opsz'_28]">
            {day.title}
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[color-mix(in_srgb,var(--ink)_78%,var(--paper))]">
            {day.summary}
          </p>
          <div className="mt-8">
            <Timeline day={day} />
          </div>
          {day.practical.length > 0 ? (
            <ul className="mt-8 space-y-2 border-t border-[var(--ink)]/10 pt-4">
              {day.practical.map((item) => (
                <li
                  key={item.text}
                  className={cn(
                    "text-[15px] leading-relaxed",
                    item.todo && "text-[var(--signal)]",
                  )}
                >
                  {item.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </section>
  );
}
