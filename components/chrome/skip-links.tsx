export function SkipLinks() {
  return (
    <nav aria-label="Skip links">
      <a
        href="#itinerary"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--paper)] focus:px-3 focus:py-2"
      >
        Skip to itinerary
      </a>
      <a
        href="#essentials"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-50 focus:bg-[var(--paper)] focus:px-3 focus:py-2"
      >
        Skip to essentials
      </a>
    </nav>
  );
}
