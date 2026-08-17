import type { Day } from "@/data/types";
import { cn } from "@/lib/utils";
import { Coords } from "./coords";
import { HutGlyph, RouteGlyph } from "./icons";

const BEAT_SPACE: Record<string, string> = {
  "arrive-muc": "min-h-[88dvh]",
  "airport-train": "min-h-[150dvh]",
  "check-in-wombat": "min-h-[72dvh]",
  "open-munich": "min-h-[80dvh]",
  eisbachwelle: "min-h-[92dvh]",
  "leave-wombat": "min-h-[78dvh]",
  "walk-hbf": "min-h-[88dvh]",
  "train-munich-innsbruck": "min-h-[240dvh]",
  "check-in-montagu": "min-h-[84dvh]",
  "train-innsbruck-bolzano": "min-h-[190dvh]",
  "bus-bolzano-ortisei": "min-h-[120dvh]",
  "onto-the-trail": "min-h-[140dvh]",
  "hike-resciesa-firenze": "min-h-[160dvh]",
  "hike-firenze-puez": "min-h-[160dvh]",
  "exit-tbd": "min-h-[110dvh]",
  "open-venice": "min-h-[80dvh]",
  "flight-home": "min-h-[180dvh]",
};

export function Timeline({ day }: { day: Day }) {
  return (
    <ol className="relative">
      {day.timeline.map((item, index) => {
        const isLast = index === day.timeline.length - 1;
        const lineMode =
          item.kind === "transport"
            ? item.mode
            : day.isHikeDay
              ? "trail"
              : day.act === 3
                ? "water"
                : "rail";

        return (
          <li
            key={item.id}
            data-beat={item.id}
            className={cn(
              "relative flex gap-4 pb-7 last:pb-2",
              BEAT_SPACE[item.id],
            )}
          >
            <div className="relative w-6 shrink-0" aria-hidden="true">
              <div
                className={cn(
                  "absolute left-[11px] top-2 w-[2px] bg-[var(--trail)]",
                  isLast ? "bottom-0" : "bottom-[-8px]",
                  lineMode === "unresolved" && "opacity-50",
                )}
              />
              {item.kind === "transport" ? (
                <span className="absolute left-[6px] top-[10px] text-[var(--ink)]">
                  <RouteGlyph mode={item.mode} />
                </span>
              ) : (
                <span className="absolute left-[8px] top-[7px] h-[8px] w-[8px] rounded-full bg-[var(--trail)]" />
              )}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 pt-0.5",
                item.kind === "event" && item.optional && "opacity-55",
              )}
            >
              {item.kind === "event" ? (
                <>
                  {item.time ? (
                    <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.06em] text-[var(--dolomite)]">
                      {item.time}
                    </p>
                  ) : null}
                  <p className="overlay-type text-[16px] font-medium leading-snug">{item.title}</p>
                  {item.optionalAnnotation ? (
                    <p className="mt-0.5 font-mono text-[12px] tracking-[0.04em] text-[var(--signal)]">
                      {item.optionalAnnotation}
                    </p>
                  ) : null}
                  {item.note ? (
                    <p className="overlay-type mt-1 text-[15px] leading-relaxed text-[var(--dolomite)]">
                      {item.note}
                    </p>
                  ) : null}
                </>
              ) : null}
              {item.kind === "transport" ? (
                <div className="pt-1">
                  <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.06em]">
                    {item.label}
                  </p>
                  {item.meta ? (
                    <p className="overlay-type mt-1 font-mono text-[12px] tracking-[0.04em] text-[var(--dolomite)]">
                      {item.meta}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {item.kind === "open" ? (
                <p className="overlay-type pt-6 pb-8 text-[16px] leading-relaxed text-[var(--dolomite)]">
                  {item.text}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}

      <li
        data-beat={day.lodging.slug}
        className={cn("relative flex gap-4 pb-1", BEAT_SPACE[day.lodging.slug])}
      >
        <div className="relative w-6 shrink-0" aria-hidden="true">
          <div className="absolute left-[11px] top-0 h-3 w-[2px] bg-[var(--trail)]" />
          <span className="absolute left-[5px] top-[10px] text-[var(--meadow)]">
            {day.lodging.kind === "hut" ? (
              <HutGlyph className="h-3.5 w-3.5" />
            ) : (
              <span
                className={cn(
                  "block h-[10px] w-[10px] rounded-full",
                  day.lodging.kind === "tbd" ? "bg-[var(--signal)]" : "bg-[var(--trail)]",
                )}
              />
            )}
          </span>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="overlay-type font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
            The night
          </p>
          <p className="overlay-type mt-1 text-[16px] font-medium leading-snug">
            {day.lodging.name}
          </p>
          {day.lodging.lngLat ? (
            <Coords
              lngLat={day.lodging.lngLat}
              label={day.lodging.name}
              className="overlay-type mt-1 block font-mono text-[11px] tracking-[0.04em] text-[var(--dolomite)] tabular-nums"
            />
          ) : null}
          <p className="overlay-type mt-1 text-[15px] leading-relaxed text-[var(--dolomite)]">
            {day.lodging.context}
          </p>
          {day.lodging.todo ? (
            <p className="mt-2 font-mono text-[12px] tracking-[0.04em] text-[var(--signal)]">
              {day.lodging.todo}
            </p>
          ) : null}
        </div>
      </li>
    </ol>
  );
}
