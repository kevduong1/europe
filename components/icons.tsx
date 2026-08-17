import type { TransportMode } from "@/data/types";

export function RouteGlyph({
  mode,
  className,
}: {
  mode: TransportMode;
  className?: string;
}) {
  const color =
    mode === "trail"
      ? "var(--meadow)"
      : mode === "water" || mode === "unresolved"
        ? mode === "unresolved"
          ? "var(--signal)"
          : "var(--lagoon)"
        : "var(--ink)";
  const dash =
    mode === "rail" || mode === "flight"
      ? "2 2.2"
      : mode === "trail" || mode === "unresolved"
        ? "0.8 2.2"
        : undefined;
  const width = mode === "bus" ? 1.4 : 1.7;

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
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
        opacity={mode === "bus" ? 0.7 : 1}
      />
    </svg>
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
