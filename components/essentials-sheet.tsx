"use client";

import { essentials } from "@/data/trip";
import { Sheet } from "./sheet";

export function EssentialsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Essentials" onClose={onClose}>
      <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
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
    </Sheet>
  );
}
