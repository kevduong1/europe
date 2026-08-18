import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { secedaGallery, wombatGallery } from "@/data/photos";
import type { Day, TimelineItem } from "@/data/types";
import { BEAT_SPACE, DEFAULT_BEAT_SPACE } from "@/lib/journey/pacing";
import { cn } from "@/lib/utils";
import { HutGlyph, RouteGlyph, TransportModeBadge } from "./icons";

function BeatMark({
  item,
  day,
}: {
  item: TimelineItem | { kind: "lodging" };
  day: Day;
}) {
  if (item.kind === "transport") {
    return (
      <span className="day-rail-stop absolute left-0 top-[10px] flex w-6 flex-col items-center gap-[3px] text-[var(--ink)]">
        <RouteGlyph mode={item.mode} />
        <TransportModeBadge mode={item.mode} />
      </span>
    );
  }

  if (item.kind === "lodging") {
    return (
      <span className="day-rail-stop absolute left-[5px] top-[10px] text-[var(--meadow)]">
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

  if (item.kind === "event" && item.emoji) {
    return (
      <span className="day-rail-stop absolute left-[2px] top-[1px] flex h-5 w-5 items-center justify-center text-[18px] leading-none">
        {item.emoji}
      </span>
    );
  }

  return (
    <span className="day-rail-stop absolute left-[8px] top-[7px] h-[8px] w-[8px] rounded-full bg-[var(--trail)]" />
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
        ) : item.optional ? (
          <p className="mt-0.5 font-mono text-[12px] tracking-[0.04em] text-[var(--signal)]">
            Optional
          </p>
        ) : null}
        {item.note ? (
          <p className="overlay-type mt-1 text-[15px] leading-relaxed text-[var(--dolomite)]">
            {item.note}
          </p>
        ) : null}
        {item.id === "check-in-wombat" ? (
          <div className="place-gallery mt-5" aria-label="Photos of Wombat's City Hostel Munich Hauptbahnhof">
            {wombatGallery.map((photo, index) => (
              <figure key={photo.src} className="place-gallery-card">
                <Image
                  className="place-gallery-image"
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 640px) 88vw, 620px"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <figcaption className="place-gallery-caption">
                  <span>{photo.caption}</span>
                  <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                    {photo.credit}
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
        {item.id === "seceda-summit" ? (
          <div
            className="seceda-gallery mt-4"
            aria-label="Photos from Seceda"
          >
            {secedaGallery.map((photo, index) => (
              <figure key={photo.src} className="seceda-gallery-card">
                <Image
                  className="seceda-gallery-image"
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 640px) 72vw, 360px"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <figcaption className="seceda-gallery-caption">
                  <span>{photo.caption}</span>
                  <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                    {photo.credit}
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
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

function BeatRow({
  beatId,
  span,
  className,
  bodyClassName,
  mark,
  children,
}: {
  beatId: string;
  span?: number;
  className?: string;
  bodyClassName?: string;
  mark: ReactNode;
  children: ReactNode;
}) {
  return (
    <li
      data-beat={beatId}
      className={cn("beat-row relative pb-10 last:pb-2", className)}
      style={
        {
          "--beat-span": `${span ?? DEFAULT_BEAT_SPACE}`,
        } as CSSProperties
      }
    >
      <div className="beat-head">
        <div className="beat-head-reveal flex gap-4">
          <div className="relative w-6 shrink-0" aria-hidden="true">
            {mark}
          </div>
          <div className={cn("min-w-0 flex-1 pt-0.5", bodyClassName)}>
            {children}
          </div>
        </div>
      </div>
    </li>
  );
}

export function Timeline({ day }: { day: Day }) {
  const lodgingAlreadyOnTimeline = day.timeline.some(
    (item) =>
      item.id === day.lodging.slug ||
      ("detailSlug" in item && item.detailSlug === day.lodging.slug),
  );
  const hideLodging =
    lodgingAlreadyOnTimeline || day.lodging.kind === "plane";

  return (
    <ol className="relative">
      {day.timeline.map((item) => (
        <BeatRow
          key={item.id}
          beatId={item.id}
          span={BEAT_SPACE[item.id]}
          mark={<BeatMark item={item} day={day} />}
        >
          <BeatBody item={item} />
        </BeatRow>
      ))}

      {hideLodging ? null : (
        <BeatRow
          beatId={day.lodging.slug}
          span={BEAT_SPACE[day.lodging.slug]}
          className="pb-1 last:pb-1"
          bodyClassName="pt-1"
          mark={<BeatMark item={{ kind: "lodging" }} day={day} />}
        >
          <p className="overlay-type font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
            The night
          </p>
          <p className="overlay-type mt-1 text-[16px] font-medium leading-snug">
            {day.lodging.name}
          </p>
        </BeatRow>
      )}
    </ol>
  );
}
