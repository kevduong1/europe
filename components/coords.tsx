import type { LngLat } from "@/data/types";
import { formatLngLat } from "@/lib/geo";

export function Coords({
  lngLat,
  label,
  className,
}: {
  lngLat: LngLat;
  label?: string;
  className?: string;
}) {
  const [lng, lat] = lngLat;
  const query = label ? `&q=${encodeURIComponent(label)}` : "";
  const href = `https://maps.apple.com/?ll=${lat},${lng}${query}`;

  return (
    <a
      href={href}
      className={
        className ??
        "overlay-type font-mono text-[11px] tracking-[0.04em] text-[var(--dolomite)] tabular-nums"
      }
      target="_blank"
      rel="noreferrer"
    >
      {formatLngLat(lngLat)}
    </a>
  );
}
