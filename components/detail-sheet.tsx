"use client";

import Image from "next/image";
import { photos } from "@/data/photos";
import { getDetailForDay } from "@/data/trip";
import { Sheet } from "./sheet";

const hutPhotos: Record<string, keyof typeof photos> = {
  "rifugio-resciesa": "resciesa",
  "rifugio-firenze": "firenze",
  "rifugio-puez": "puez",
};

export function DetailSheet({
  dayId,
  slug,
  onClose,
}: {
  dayId: number;
  slug: string;
  onClose: () => void;
}) {
  const detail = getDetailForDay(dayId, slug);
  if (!detail) return null;
  const hutPhotoKey = hutPhotos[detail.slug];
  const hutPhoto = hutPhotoKey ? photos[hutPhotoKey] : null;

  return (
    <Sheet title={detail.title} onClose={onClose}>
      {hutPhoto ? (
        <div className="relative -mx-5 mb-6 aspect-[16/10] overflow-hidden">
          <Image
            src={hutPhoto.src}
            alt={hutPhoto.alt}
            fill
            sizes="640px"
            className="object-cover"
          />
        </div>
      ) : null}
      <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
        Day {detail.dayId}
      </p>
      <h2 className="font-display mt-2 text-[28px] leading-[1.1]">{detail.title}</h2>
      <p className="mt-4 text-[16px] leading-relaxed">{detail.body}</p>
      {detail.extra ? (
        <p className="mt-4 text-[16px] leading-relaxed text-[var(--dolomite)]">{detail.extra}</p>
      ) : null}
      {detail.todo ? (
        <p className="mt-6 font-mono text-[13px] tracking-[0.04em] text-[var(--signal)]">
          {detail.todo}
        </p>
      ) : null}
    </Sheet>
  );
}
