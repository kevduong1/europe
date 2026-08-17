import { essentials } from "@/data/trip";

export function EssentialsSection() {
  return (
    <section
      id="essentials"
      className="relative flex min-h-[85dvh] flex-col justify-end"
    >
      <article className="mx-auto mb-[max(12px,env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] max-w-[560px] rounded-2xl bg-[var(--paper)] px-5 py-6 shadow-[0_12px_40px_rgba(31,36,33,0.14)]">
        <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail)]">
          Trip-wide
        </p>
        <h2 className="font-display mt-2 text-[28px] leading-[1.1]">Essentials</h2>
        <ul className="mt-8 space-y-8">
          {essentials.map((item) => (
            <li key={item.id}>
              <h3 className="text-[16px] font-medium">{item.title}</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-[color-mix(in_srgb,var(--ink)_82%,var(--paper))]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
