import { essentials } from "@/data/trip";
import { OverlaySection } from "./overlay-section";

export function EssentialsSection() {
  return (
    <OverlaySection
      id="essentials"
      className="[--day-head-h:5.5rem]"
      eyebrow="Trip-wide"
      title="Essentials"
    >
      <ul className="mt-8 space-y-8 pl-10">
        {essentials.map((item) => (
          <li key={item.id} className="min-h-[48dvh]">
            <div className="beat-head">
              <h3 className="overlay-type text-[16px] font-medium">{item.title}</h3>
              <p className="overlay-type mt-2 text-[16px] leading-relaxed">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </OverlaySection>
  );
}
