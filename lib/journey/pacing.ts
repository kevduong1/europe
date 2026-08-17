/**
 * Single home for scroll pacing: how long each beat lasts under the reader's
 * thumb, and where along the viewport the various "now" anchors sit. Tune
 * numbers here — nothing else should hardcode them.
 */

/** vh height for a beat's scroll box when it has no entry below. Nothing should still be relying on this by default — every real beat gets a tuned span. */
export const DEFAULT_BEAT_SPACE = 56;

/**
 * Per-beat scroll length, in vh, keyed by timeline item id (or lodging slug
 * for the auto-generated "the night" row). Longer = more scroll before the
 * next moment arrives.
 */
export const BEAT_SPACE: Record<string, number> = {
  "depart-mci": 72,
  // Same MCI<->Munich crossing as flight-home, just outbound — kept equal so
  // neither leg reads as more or less important than the other.
  "flight-out": 200,
  "arrive-muc": 88,
  "airport-train": 150,
  "check-in-wombat": 72,
  "open-munich": 80,
  eisbachwelle: 92,
  // Auto "the night" row for wombat-hostel (days 2 & 3): compact card, a
  // little more than the bare default so it doesn't feel clipped.
  "wombat-hostel": 64,
  "leave-wombat": 78,
  "walk-hbf": 88,
  "train-munich-innsbruck": 240,
  "check-in-montagu": 84,
  // Auto "the night" row for montagu-hostel (day 4) — same reasoning as wombat-hostel.
  "montagu-hostel": 64,
  "train-innsbruck-bolzano": 190,
  "bus-bolzano-ortisei": 120,
  "onto-the-trail": 140,
  // Auto "the night" rows for the three huts — these are the payoff beat of
  // a full hiking day, worth more room than a city check-in.
  "rifugio-resciesa": 90,
  "hike-resciesa-firenze": 160,
  "rifugio-firenze": 90,
  "hike-firenze-puez": 160,
  "rifugio-puez": 90,
  // Day 8, out of the mountains: hike down (was the single unresolved
  // "exit-tbd" placeholder, now three real beats).
  "exit-to-valley": 130,
  // Mirrors bus-bolzano-ortisei — same route, opposite direction.
  "bus-ortisei-bolzano": 120,
  // Long ride down to Venice; give it the room a train-munich-innsbruck-scale leg gets.
  "train-bolzano-venice": 200,
  // Auto "the night" row, still TBD — kept short since there's nothing to read yet.
  "exit-night": 60,
  "open-venice": 80,
  // Auto "the night" row, still TBD — same as exit-night.
  "venice-lodging": 60,
  // Same MCI<->Munich crossing as flight-out.
  "flight-home": 200,
};

/** Hero keeps the overview camera until its base clears this share of the screen. */
export const FREEZE = 0.52;

/** Where on screen "now" is read from for the map camera — a bit above centre. */
export const ANCHOR = 0.4;

/** How late in a day's last beat the next day's camera starts bleeding in. */
export const HANDOFF = 0.72;

/**
 * Day-chrome anchor line, as a share of viewport height above the header
 * (capped in px so it doesn't run away on very tall viewports). Mirrors
 * ANCHOR's role but in trip-shell's px-based math, since header height varies.
 */
export const DAY_ANCHOR_VH = 0.3;
export const DAY_ANCHOR_MAX_PX = 240;

/**
 * Where the outgoing day's chrome starts fading, as a share of viewport
 * height above the header. Must stay far enough above DAY_ANCHOR that the
 * fade finishes before the incoming day's head reaches the sticky pin line
 * (which happens at headerHeight, i.e. DAY_ANCHOR's headerHeight + 0 point) —
 * see trip-shell.tsx for the no-overlap argument.
 */
export const DAY_FADE_START_VH = 0.5;
export const DAY_FADE_START_MAX_PX = 400;
