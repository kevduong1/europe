import { overnightStops } from "@/data/route";
import { days } from "@/data/trip";
import { Coords } from "./coords";
import { DaySection } from "./day-section";

export function Itinerary() {
  return (
    <div id="itinerary">
      {days.map((day) => (
        <DaySection key={day.id} day={day} />
      ))}

      <section
        id="places"
        className="relative flex min-h-[80dvh] flex-col justify-end"
      >
        <article className="mx-auto mb-[max(12px,env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] max-w-[560px] rounded-2xl bg-[var(--paper)] px-5 py-6 shadow-[0_12px_40px_rgba(31,36,33,0.14)]">
          <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
            Coordinates
          </p>
          <h2 className="font-display mt-2 text-[28px] leading-[1.1]">
            Every stop
          </h2>
          <ul className="mt-6 space-y-4">
            {overnightStops.map((stop) => (
              <li
                key={stop.id}
                className="flex items-baseline justify-between gap-4"
              >
                <p className="text-[16px] font-medium">{stop.label}</p>
                <Coords lngLat={stop.lngLat} label={stop.label} />
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
