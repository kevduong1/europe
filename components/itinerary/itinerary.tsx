import { overnightStops } from "@/trip/markers";
import { days } from "@/trip";
import { Coords } from "./coords";
import { DaySection } from "./day-section";
import { OverlaySection } from "./overlay-section";

export function Itinerary() {
  return (
    <div id="itinerary">
      {days.map((day) => (
        <DaySection key={day.id} day={day} />
      ))}

      <OverlaySection id="places" eyebrow="Coordinates" title="Every stop">
        <ul className="mt-6 space-y-3 pl-10">
          {overnightStops.map((stop) => (
            <li
              key={stop.id}
              className="flex items-baseline justify-between gap-4"
            >
              <p className="overlay-type text-[16px]">{stop.label}</p>
              <Coords lngLat={stop.lngLat} label={stop.label} />
            </li>
          ))}
        </ul>
      </OverlaySection>
    </div>
  );
}
