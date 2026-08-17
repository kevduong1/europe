import type { TransportMode } from "@/data/types";

type RouteStyle = {
  color: string;
  dash?: string;
  width: number;
  opacity?: number;
  /** x-positions (0–22) for short perpendicular ticks, e.g. cable hangers. */
  ticks?: number[];
};

/**
 * Exhaustive over TransportMode: every mode must supply its own line
 * treatment, so a new mode added to the union fails the typecheck here
 * instead of silently falling through to whatever branch comes last.
 */
const ROUTE_STYLE: Record<TransportMode, RouteStyle> = {
  rail: { color: "var(--ink)", dash: "2 2.2", width: 1.7 },
  flight: { color: "var(--ink)", dash: "2 2.2", width: 1.7 },
  trail: { color: "var(--meadow)", dash: "0.8 2.2", width: 1.7 },
  bus: { color: "var(--ink)", width: 1.4, opacity: 0.7 },
  water: { color: "var(--lagoon)", width: 1.7 },
  unresolved: { color: "var(--signal)", dash: "0.8 2.2", width: 1.7 },
  // A cable car isn't a train: a solid, taut line (no dash) with widely
  // spaced perpendicular ticks reads as a cable strung between towers.
  gondola: { color: "var(--dolomite)", width: 1.5, ticks: [5, 11, 17] },
};

export function RouteGlyph({
  mode,
  className,
}: {
  mode: TransportMode;
  className?: string;
}) {
  const style = ROUTE_STYLE[mode];

  return (
    <svg
      className={className}
      width="22"
      height="8"
      viewBox="0 0 22 8"
      aria-hidden="true"
    >
      <line
        x1="1"
        y1="4"
        x2="21"
        y2="4"
        fill="none"
        stroke={style.color}
        strokeWidth={style.width}
        strokeLinecap="round"
        strokeDasharray={style.dash}
        opacity={style.opacity ?? 1}
      />
      {style.ticks?.map((x) => (
        <line
          key={x}
          x1={x}
          y1="1.6"
          x2={x}
          y2="6.4"
          stroke={style.color}
          strokeWidth={1.1}
          strokeLinecap="round"
          opacity={style.opacity ?? 1}
        />
      ))}
    </svg>
  );
}

/**
 * Exhaustive over TransportMode, same rationale as ROUTE_STYLE above.
 */
const TRANSPORT_EMOJI: Record<TransportMode, string> = {
  trail: "🥾",
  bus: "🚌",
  gondola: "🚡",
  rail: "🚆",
  flight: "✈️",
  water: "⛴️",
  unresolved: "❓",
};

const TRANSPORT_MODE_LABEL: Record<TransportMode, string> = {
  trail: "Trail",
  bus: "Bus",
  gondola: "Gondola",
  rail: "Rail",
  flight: "Flight",
  water: "Ferry",
  unresolved: "Mode to be resolved",
};

/**
 * Small mode badge for a transport row: a decorative emoji glyph in a
 * fixed-size slot (so row width never shifts between platforms' differing
 * emoji metrics) plus a screen-reader-only text label, since the visible
 * label/meta text doesn't always spell the mode out on its own.
 */
export function TransportModeBadge({
  mode,
  className,
}: {
  mode: TransportMode;
  className?: string;
}) {
  return (
    <span className={className}>
      <span
        aria-hidden="true"
        className="flex h-[14px] w-[16px] items-center justify-center text-[11px] leading-none"
      >
        {TRANSPORT_EMOJI[mode]}
      </span>
      <span className="sr-only">{TRANSPORT_MODE_LABEL[mode]}</span>
    </span>
  );
}

export function HutGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 14 14"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <polygon points="7,1.2 13,6.6 13,13 1,13 1,6.6" fill="currentColor" />
    </svg>
  );
}
