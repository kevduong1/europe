"use client";

import Image from "next/image";
import Link from "next/link";
import { getDestination } from "@/data/trip";
import { photos } from "@/data/photos";
import { dayHref } from "@/lib/paths";
import { Sheet } from "./sheet";

export function DestinationSheet({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const destination = getDestination(slug);
  if (!destination) return null;

  const photo =
    destination.slug === "puez-odle"
      ? photos.dolomites
      : destination.slug === "munich"
        ? photos.munich
        : destination.slug === "venice"
          ? photos.venice
          : destination.slug === "innsbruck"
            ? photos.innsbruck
            : photos.ortisei;

  return (
    <Sheet title={destination.name} onClose={onClose}>
      <div className="relative -mx-5 mb-6 aspect-[16/10] overflow-hidden">
        <Image
          src={destination.photo}
          alt={destination.photoAlt}
          fill
          sizes="640px"
          className="object-cover"
          priority
        />
      </div>
      <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
        {destination.dates}
      </p>
      <h2 className="font-display mt-2 text-[28px] leading-[1.1]">{destination.name}</h2>
      <p className="mt-4 text-[16px] leading-relaxed">{destination.summary}</p>
      <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
        Days
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {destination.dayIds.map((id) => (
          <li key={id}>
            <Link href={dayHref(id)} className="text-[var(--lagoon)] underline-offset-2 hover:underline">
              Day {id}
            </Link>
          </li>
        ))}
      </ul>
      {destination.stops ? (
        <>
          <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
            Stops
          </p>
          <p className="mt-2 text-[16px] leading-relaxed">{destination.stops.join(" · ")}</p>
        </>
      ) : null}
      <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
        Lodging
      </p>
      <p className="mt-2 text-[16px] leading-relaxed">{destination.lodging}</p>
      <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
        In
      </p>
      <p className="mt-2 text-[16px] leading-relaxed">{destination.transportIn}</p>
      <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
        Out
      </p>
      <p className="mt-2 text-[16px] leading-relaxed">{destination.transportOut}</p>
      <p className="mt-8 font-mono text-[11px] tracking-[0.04em] text-[var(--dolomite)]">
        {photo.credit}
      </p>
    </Sheet>
  );
}
