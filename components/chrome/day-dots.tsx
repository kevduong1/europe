import type { Day } from "@/lib/engine/types";

export function DayDots({
  days,
  activeDay,
  visible,
}: {
  days: readonly Day[];
  activeDay: Day;
  visible: boolean;
}) {
  return (
    <nav
      aria-label={`Trip days, ${days.length} total`}
      aria-hidden={!visible}
      className="day-dots"
      data-visible={visible}
    >
      {days.map((day) => {
        const isActive = visible && activeDay.id === day.id;
        return (
          <a
            key={day.id}
            href={`#day-${day.id}`}
            aria-label={`Day ${day.id}: ${day.title}`}
            aria-current={isActive ? "step" : undefined}
            tabIndex={visible ? undefined : -1}
            className="day-dot"
            data-active={isActive}
          >
            <span>{day.id}</span>
          </a>
        );
      })}
    </nav>
  );
}
