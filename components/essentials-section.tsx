import { essentials } from "@/data/trip";

export function EssentialsSection() {
  return (
    <section
      id="essentials"
      className="relative flex min-h-[100dvh] flex-col justify-end [--day-head-h:5.25rem]"
    >
      <div className="overlay-panel mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
        <div className="card-head">
          <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
            Trip-wide
          </p>
          <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08]">
            Essentials
          </h2>
        </div>
        <ul className="mt-8 space-y-8">
          {essentials.map((item) => (
            <li key={item.id} className="min-h-[48dvh]">
              <h3 className="beat-head overlay-type text-[16px] font-medium">
                {item.title}
              </h3>
              <p className="beat-copy overlay-type mt-2 text-[16px] leading-relaxed">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
