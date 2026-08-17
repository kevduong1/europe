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
        className="relative flex min-h-[100dvh] flex-col justify-end [--day-head-h:5.25rem]"
      >
        <div className="overlay-panel mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
          <div className="card-head">
            <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
              Coordinates
            </p>
            <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08]">
              Every stop
            </h2>
          </div>
          <ul className="mt-6 space-y-3">
            {overnightStops.map((stop) => (
              <li
                key={stop.id}
                className="flex items-baseline justify-between gap-4"
              >
                <p className="overlay-type text-[16px]">{stop.label}</p>
                <Coords lngLat={stop.lngLat} label={stop.label} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
