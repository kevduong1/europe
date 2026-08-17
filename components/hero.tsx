import { days, trip } from "@/data/trip";
import { RouteGlyph } from "./icons";

export function Hero() {
  return (
    <section
      id="hero"
      className="hero-stage relative flex flex-col justify-end"
    >
      <div className="px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[calc(7rem+env(safe-area-inset-top))]">
        <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail-ink)]">
          {trip.eyebrow}
        </p>
        <h1 className="overlay-type font-display mt-3 max-w-[20ch] text-[42px] leading-[1.05] [font-variation-settings:'WONK'_1,'SOFT'_20,'opsz'_42] sm:text-[52px]">
          {trip.title}
        </h1>
        <p className="overlay-type mt-4 flex flex-wrap items-center gap-x-1 text-[14px] text-[var(--ink)]">
          <span>Munich</span>
          <RouteGlyph mode="rail" />
          <span>Innsbruck</span>
          <RouteGlyph mode="trail" />
          <span>the Dolomites</span>
          <RouteGlyph mode="water" />
          <span>Venice</span>
        </p>
        <p className="overlay-type mt-6 max-w-[36em] text-[16px] leading-relaxed">
          {trip.editorial}
        </p>
        <a
          href="#itinerary"
          className="overlay-type mt-8 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--trail-ink)]"
        >
          Scroll the itinerary
          <span aria-hidden="true" className="text-[16px]">
            ↓
          </span>
        </a>
        <p className="overlay-type mt-3 font-mono text-[11px] tracking-[0.06em] text-[var(--dolomite)]">
          {days.length} days · the map follows as you go
        </p>
      </div>
    </section>
  );
}
