import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OverlaySection({
  id,
  eyebrow,
  title,
  className,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("relative flex flex-col", className)}>
      <div className="mx-auto w-full max-w-[640px] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
        <div className="card-head pl-10">
          <p className="overlay-type font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--trail-ink)]">
            {eyebrow}
          </p>
          <h2 className="overlay-type font-display mt-2 text-[32px] leading-[1.08]">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}
