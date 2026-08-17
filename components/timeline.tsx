import type { Day, TimelineItem } from "@/data/types";
import { cn } from "@/lib/utils";
import { HutGlyph, RouteGlyph } from "./icons";

const BEAT_SPACE: Record<string, string> = {
  "depart-mci": "min-h-[72dvh]",
  "flight-out": "min-h-[220dvh]",
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

function BeatMark({
  item,
  day,
}: {
  item: TimelineItem | { kind: "lodging" };
  day: Day;
}) {
  if (item.kind === "transport") {
    return (
      <span className="absolute left-[6px] top-[10px] text-[var(--ink)]">
        <RouteGlyph mode={item.mode} />
      </span>
    );
  }

  if (item.kind === "lodging") {
    return (
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
    );
  }

  return (
    <span className="absolute left-[8px] top-[7px] h-[8px] w-[8px] rounded-full bg-[var(--trail)]" />
  );
}

function BeatBody({ item }: { item: TimelineItem }) {
  if (item.kind === "event") {
    return (
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
    );
  }

  if (item.kind === "transport") {
    return (
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
    );
  }

  return (
    <p className="overlay-type pt-2 text-[16px] leading-relaxed text-[var(--dolomite)]">
      {item.text}
    </p>
  );
}

export function Timeline({ day }: { day: Day }) {
  const lodgingAlreadyOnTimeline = day.timeline.some(
    (item) => item.id === day.lodging.slug,
  );
  const hideLodging =
    lodgingAlreadyOnTimeline || day.lodging.kind === "plane";

  return (
    <ol className="relative">
      {day.timeline.map((item) => (
        <li
          key={item.id}
          data-beat={item.id}
          className={cn(
            "relative min-h-[56dvh] pb-10 last:pb-2",
            BEAT_SPACE[item.id],
            item.kind === "event" && item.optional && "opacity-55",
          )}
        >
          <div className="beat-head">
            <div className="flex gap-4">
              <div className="relative w-6 shrink-0" aria-hidden="true">
                <BeatMark item={item} day={day} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <BeatBody item={item} />
              </div>
            </div>
          </div>
        </li>
      ))}

      {hideLodging ? null : (
        <li
          data-beat={day.lodging.slug}
          className={cn("relative min-h-[56dvh] pb-1", BEAT_SPACE[day.lodging.slug])}
        >
          <div className="beat-head">
            <div className="flex gap-4">
              <div className="relative w-6 shrink-0" aria-hidden="true">
                <BeatMark item={{ kind: "lodging" }} day={day} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <p className="overlay-type font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
                  The night
                </p>
                <p className="overlay-type mt-1 text-[16px] font-medium leading-snug">
                  {day.lodging.name}
                </p>
              </div>
            </div>
          </div>
        </li>
      )}
    </ol>
  );
}
