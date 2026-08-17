import { essentials } from "@/data/trip";

export function EssentialsSection() {
  return (
    <section
      id="essentials"
      className="relative flex flex-col [--day-head-h:5.5rem]"
    >
      <div className="overlay-panel mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
        <div className="card-head pl-10">
          <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
            Trip-wide
          </p>
          <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08]">
            Essentials
          </h2>
        </div>
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
      </div>
    </section>
  );
}
