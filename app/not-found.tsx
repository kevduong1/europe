import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--paper)] px-5">
      <div className="max-w-[640px]">
        <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-[var(--dolomite)]">
          Off the route
        </p>
        <h1 className="font-display mt-2 text-[28px] leading-[1.1]">
          This page isn’t on the trip.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed">
          <Link href="/" className="text-[var(--lagoon)]">
            Back to the journey
          </Link>
        </p>
      </div>
    </div>
  );
}
