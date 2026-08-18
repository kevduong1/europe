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
  "arrive-muc": 122,
  "airport-train": 165,
  // Arrival walk, close camera move, three-photo hold, and the gallery need
  // enough scroll room to read as a sequence rather than one snap.
  "check-in-wombat": 210,
  // Day 3's auto "the night" row replays the hostel close-up and photo hold.
  "wombat-hostel": 170,
  "open-munich": 80,
  // Camera set-pieces (rides a walking line / zooms while rotating bearing)
  // — need more room than a plain event so the move reads, not snaps.
  "english-garden": 150,
  "hofbrauhaus": 190,
  "leave-wombat": 116,
  "walk-hbf": 88,
  "train-munich-innsbruck": 240,
  "check-in-montagu": 84,
  // Auto "the night" row for montagu-hostel (day 4) — same reasoning as wombat-hostel.
  "montagu-hostel": 64,
  "train-innsbruck-bolzano": 190,
  "bus-bolzano-ortisei": 120,
  "onto-the-trail": 140,
  // Auto "the night" row for the hut — the payoff beat of a full hiking day,
  // worth more room than a city check-in.
  "rifugio-resciesa": 90,
  "hike-resciesa-firenze": 160,
  "rifugio-firenze": 90,
  // Day 7: busiest day in the trip (5 beats). Kept individually generous —
  // seceda-summit especially, it's the payoff of the whole middle
  // section — but scaled back from a naive sum so the day's total (~580vh)
  // lands close to days 4 and 5 (554/540) rather than dwarfing them.
  "hike-firenze-seceda": 150,
  "seceda-summit": 110,
  "down-to-ortisei": 90,
  "to-val-di-fassa": 90,
  "qc-terme-dolomiti": 80,
  // Auto "the night" row — a real hotel night, not a TBD placeholder, so a
  // touch more than the TBD lodging rows below.
  "val-di-fassa-night": 60,
  // Shorter mountain leg than bus-bolzano-ortisei.
  "bus-fassa-bolzano": 90,
  // Long ride down to Venice; give it the room a train-munich-innsbruck-scale leg gets.
  "train-bolzano-venice": 200,
  // Auto "the night" row, first night in Venice — same weight as the other real check-ins.
  "venice-first-night": 64,
  "open-venice": 80,
  // Auto "the night" row, still TBD — kept short since there's nothing to read yet.
  "venice-lodging": 60,
  // Same MCI<->Munich crossing as flight-out. Also day 10's lodging slug
  // (kind: "plane"), so this one span covers both — no separate lodging row.
  "flight-home": 200,
};

/** Hero keeps the overview camera until its base clears this share of the screen. */
export const FREEZE = 0.52;

/** Where on screen "now" is read from for the map camera — a bit above centre. */
export const ANCHOR = 0.3;

/** How late in a day's last beat the next day's camera starts bleeding in. */
export const HANDOFF = 0.72;

/** Last-beat overrides for scenes that need an earlier or later day handoff. */
export const BEAT_HANDOFF: Record<string, number> = {
  // Start naming Day 2 while the aircraft is on final approach.
  "flight-out": 0.7,
  // Preserve the full Hofbräuhaus orbit and its two-photo hold.
  hofbrauhaus: 0.9,
};

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
