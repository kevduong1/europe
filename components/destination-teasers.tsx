import Image from "next/image";
import Link from "next/link";
import { destinations, teaserDestinations } from "@/data/trip";
import { destinationHref } from "@/lib/paths";

export function DestinationTeasers() {
  const teasers = teaserDestinations
    .map((slug) => destinations.find((destination) => destination.slug === slug))
    .filter((destination) => destination != null);

  return (
    <div className="flex flex-col">
      {teasers.map((destination) => {
        const featured = destination.slug === "puez-odle";
        return (
          <Link
            key={destination.slug}
            href={destinationHref(destination.slug)}
            className="group relative block overflow-hidden"
          >
            <div className={featured ? "relative aspect-[3/4] sm:aspect-[4/5]" : "relative aspect-[16/10]"}>
              <Image
                src={destination.photo}
                alt={destination.photoAlt}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                loading={featured ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-[rgba(31,36,33,0.28)]" />
              <h2 className="font-display absolute bottom-5 left-5 right-5 text-[28px] leading-[1.1] text-[var(--paper)]">
                {destination.name}
              </h2>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
