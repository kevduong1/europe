"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

type SheetProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export function Sheet({ title, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; dragging: boolean }>({ y: 0, dragging: false });

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = { y: event.clientY, dragging: true };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging || !panelRef.current) return;
    const dy = Math.max(0, event.clientY - dragRef.current.y);
    panelRef.current.style.transform = `translateY(${dy}px)`;
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging || !panelRef.current) return;
    const dy = Math.max(0, event.clientY - dragRef.current.y);
    dragRef.current.dragging = false;
    const threshold = panelRef.current.offsetHeight * 0.18;
    if (dy > threshold) {
      onClose();
      return;
    }
    if (prefersReducedMotion()) {
      panelRef.current.style.transform = "translateY(0)";
    } else {
      panelRef.current.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
      panelRef.current.style.transform = "translateY(0)";
      window.setTimeout(() => {
        if (panelRef.current) panelRef.current.style.transition = "";
      }, 300);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[rgba(31,36,33,0.70)]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden bg-[var(--paper)] shadow-[0_-8px_32px_rgba(31,36,33,0.10)]",
          "translate-y-0 outline-none",
          prefersReducedMotion() ? "" : "animate-sheet-up",
        )}
      >
        <div
          className="flex cursor-grab touch-none flex-col items-center pt-3 pb-1 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="h-1 w-10 rounded-full bg-[var(--dolomite)]/50" />
        </div>
        <div className="overflow-y-auto px-5 pb-10 pt-2">{children}</div>
      </div>
    </div>
  );
}
