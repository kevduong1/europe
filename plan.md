# Modularization Plan — Europe 2026 Trip Site

A phased refactor that separates this codebase into three clean layers — a
trip-agnostic **engine**, this trip's **content**, and generic
**presentation** — so that the real Sept 2026 trip keeps working exactly as it
does today, while the structure becomes a worked example that can later be
extracted into a template + authoring skill.

**Nothing about the real trip changes.** No copy, no coordinates, no camera
moves, no visual behavior. This is a pure restructuring.

---

## 1. Current state audit

### What already works well

- `data/` is mostly declarative: `days[]` with typed timeline items, route
  geometry as named polylines, photos with credits. Components map over data.
- `DaySection` / `Timeline` are already generic — they render *any* `Day`.
  There is no per-day JSX anywhere. (This is why "each day as its own React
  component" isn't quite the right cut — days are data, and the components
  are fine. What *is* day-specific lives elsewhere; see below.)
- `lib/journey-view.ts` documents an intended public boundary for the camera
  engine. The intent is right; the contents behind it aren't separated yet.

### Where concerns are tangled

| File | Lines | Problem |
|---|---|---|
| `lib/journey/beats.ts` | 817 | One giant `switch` over **trip-specific beat ids** (`"hofbrauhaus"`, `"seceda-summit"`, …) plus a `switch` per day in `viewForDay`. Every new day/beat edits this file. Mixes reusable patterns (orbit, ride-a-line, settle) with authored choreography. |
| `lib/journey/pacing.ts` | 105 | `BEAT_SPACE` / `BEAT_HANDOFF` hardcode per-beat scroll spans **by trip-specific id**, far from the day data they pace. Also holds genuinely engine-level constants (`ANCHOR`, `FREEZE`, `HANDOFF`). Two concerns, one file. |
| `lib/journey/cameras.ts` | 417 | Trip-agnostic helpers (`pose`, `cityHold`) live next to this trip's authored `CITY.*` poses and `T` trail positions. |
| `lib/journey/clusters.ts` | 40 | `CLUSTERS.munich`, `CLUSTERS.pastDolomites` — trip content in `lib/`. (`clusterState()` itself is generic.) |
| `components/journey-map.tsx` | 894 | Map bootstrap, basemap/terrain, route layers, three marker systems (stops, clusters, photo pins), responsive camera correction, and view application — all in one client component. None of it is trip-specific except its direct imports from `data/route`. |
| `components/trip-shell.tsx` | 464 | Scroll→frame orchestration (measure/paint rAF loop), URL→scroll restoration, header chrome, day-dots nav, skip links, footer — one component. |
| `data/route.ts` | 671 | Named places (`WOMBAT`, `SECEDA_RIDGE_END`…), leg polylines, the joined trail, overnight stops, clusters, photo pins — several distinct concerns in one file, imported piecemeal by `beats.ts`. |
| `app/globals.css` | 794 | All styling for chrome, rail, beats, map pins, hero in one file. |

### The dependency smell in one sentence

`lib/` (supposedly reusable) imports trip content from `data/` and hardcodes
trip ids, while `data/` holds both *content* (what the trip is) and
*choreography inputs* (how the camera should present it) with no line between
them.

### The implicit string contract

The system is held together by beat ids matching across four places, with no
compile-time or runtime check:

1. `data/trip.ts` — timeline item `id` / lodging `slug`
2. `lib/journey/beats.ts` — `case "that-id":`
3. `lib/journey/pacing.ts` — `BEAT_SPACE["that-id"]`
4. DOM `data-beat` attributes read by `lib/journey/scroll.ts`

A typo silently falls through to a default camera and default span. Making
this contract explicit and checkable is a core goal.

---

## 2. Target architecture

Three layers with a strict, enforceable import direction:

```
app/ (routes)  →  components/ (presentation)  →  trip/ (content)  →  lib/engine/ (engine)
```

- **`lib/engine/`** — knows nothing about Munich or the Dolomites. No
  trip-specific ids, coordinates, or labels. Could be published as a package
  tomorrow.
- **`trip/`** — everything that makes this *this* trip: itinerary content,
  geometry, photos, camera choreography, pacing. This is the layer a future
  template user rewrites.
- **`components/`** — render from `trip/` data through engine primitives.
  Generic given the data; a template user shouldn't need to touch them.

### Directory layout

```
lib/engine/                    # trip-agnostic engine (renamed from lib/journey + friends)
  geo.ts                       # (moved as-is from lib/geo.ts)
  palette.ts                   # theme tokens (currently lib/palette.ts)
  motion.ts                    # prefers-reduced-motion
  types.ts                     # JourneyView, DayModule, TripDefinition, Day, TimelineItem, …
  camera.ts                    # pose(), cityHold(), mix(), holdThen(), hikeLine(), rideLine()
  scroll.ts                    # readJourneyView(hero, sections, vh, registry)
  pacing.ts                    # ANCHOR, FREEZE, HANDOFF, DAY_ANCHOR_*, DEFAULT_BEAT_SPACE only
  clusters.ts                  # clusterState(dayId, stopClusters) — generic
  registry.ts                  # buildTripRegistry(days: DayModule[]) + dev-time validation
  paths.ts                     # parseTripPath / beatIdForDetail, parameterized by trip data
  map/
    basemap-style.ts           # (moved from lib/basemap-style.ts)
    layers.ts                  # addRouteLayers, lineFeature, setLineOpacity, crumbs
    markers.ts                 # pinElement, clusterElement, photoPinElement, planeElement, applyMarkers
    camera-apply.ts            # applyCamera + zoomOffsetFor/pitchScaleFor responsive math
    apply-view.ts              # applyTrail/applyFlight/applyLocalRoute/applyTerrain/applyView

trip/                          # ← the content layer; the only place "Europe 2026" exists
  index.ts                     # assembles TripDefinition: meta + day modules + geo + registry
  meta.ts                      # title, eyebrow, editorial (today's `trip` object)
  places.ts                    # named coordinates: MCI, MUC, WOMBAT, SECEDA_RIDGE_END, …
  geometry/
    legs.ts                    # rail/trail/bus/gondola polylines + joined orangeTrail + legT
    local-routes.ts            # walkEnglischerGarten etc. + LocalRouteId union
    routed-paths.ts            # (moved) Valhalla/OSM routed geometry
    routed-dolomites.ts        # (moved)
    flights.ts                 # flightOut / flightHome great circles
  cameras.ts                   # CITY poses, T trail positions, OVERVIEW, shared orbit-end constants
  clusters.ts                  # CLUSTERS groups + stopClusters data
  markers.ts                   # overnightStops, photoPins, unresolvedPoint
  photos.ts                    # (moved from data/photos.ts)
  destinations.ts              # destinations, details, essentials (split from data/trip.ts)
  days/
    day-01-fly-out.ts
    day-02-landing-munich.ts
    day-03-munich.ts
    day-04-innsbruck.ts
    day-05-into-the-dolomites.ts
    day-06-resciesa-firenze.ts
    day-07-seceda.ts
    day-08-val-di-fassa.ts
    day-09-venice.ts
    day-10-flight-home.ts

components/
  trip-shell.tsx               # thin composition: chrome + map stage + main
  chrome/
    trip-header.tsx            # brand/day cross-fade header
    day-dots.tsx               # day navigation dots
    skip-links.tsx
  itinerary/
    itinerary.tsx, day-section.tsx, timeline.tsx, coords.tsx, overlay-section.tsx
  map/
    journey-map.tsx            # thin: owns the MapLibre instance, delegates to lib/engine/map/*
  hero.tsx, essentials-section.tsx, icons.tsx, register-sw.tsx
  hooks/
    use-scroll-sync.ts         # the measure/paint rAF loop from trip-shell
    use-route-scroll.ts        # pathname → scrollIntoView restoration

app/                           # unchanged routes; pages import from trip/ instead of data/
```

`data/` disappears; its contents split into `trip/` (content) and
`lib/engine/types.ts` (the generic type definitions, which contain nothing
trip-specific).

### The core new abstraction: `DayModule`

Each day becomes **one file that owns everything about that day** — this is
the "each day is its own piece" the refactor is really after:

```ts
// lib/engine/types.ts
export type BeatDefinition = {
  /** Scroll length in vh for this beat's box. */
  space: number;
  /** Camera for this beat at progress t ∈ 0..1. */
  view: (t: number) => JourneyView;
  /** Optional override for how late the next day's camera bleeds in. */
  handoff?: number;
};

export type DayModule = {
  day: Day;                                  // content: timeline, lodging, practical
  beats: Record<string, BeatDefinition>;     // choreography, keyed by beat id
  enterView: JourneyView;                    // today's viewForDay(dayId) case
};
```

```ts
// trip/days/day-03-munich.ts  (sketch — real one carries today's exact values)
export const day3: DayModule = {
  day: {
    id: 3, isoDate: "2026-09-07", /* … unchanged content from data/trip.ts … */
  },
  enterView: cityHold(3, CITY.munich, "Munich · open day", { /* … */ }),
  beats: {
    "open-munich":    { space: 80,  view: (t) => /* body of today's case */ },
    "english-garden": { space: 150, view: (t) => gardenWalk(3, t) },
    "hofbrauhaus":    { space: 190, handoff: 0.9, view: (t) => hofbrauhausOrbit(3, t) },
    "wombat-hostel":  { space: 170, view: (t) => wombatMoment(3, "…", t) },
  },
};
```

`buildTripRegistry(dayModules)` replaces the two switches in `beats.ts` with
lookups, and — the payoff — **validates the string contract at build/dev
time**: every timeline item id and lodging slug must have a beat definition
(or explicitly opt into a default), and every beat definition must correspond
to a timeline row. The silent-fallthrough failure mode becomes a loud error.

Shared choreography helpers that serve multiple days (`wombatMoment`,
`munichStay`, ride/hike wrappers, orbit-end continuity constants like
`HOFBRAUHAUS_ORBIT_END`) live in `trip/cameras.ts` — they are shared *trip*
vocabulary, not engine code. Generic patterns with no trip knowledge
(`mix`, `holdThen`, `rideLine`, `hikeLine`, `pose`) move down into
`lib/engine/camera.ts`.

### What deliberately does *not* change

- The `Day`/`TimelineItem` data model, routes under `app/`, the service
  worker, the maplibre worker route, and all CSS class contracts
  (`data-beat`, `data-day`, `--day-*` custom properties).
- Rendering behavior: `DaySection`/`Timeline` keep rendering from `Day` data.
  We are not creating `<Day3 />` React components — per-day *JSX* would copy
  identical markup ten times and make consistency edits ten-file chores. The
  per-day file is a data + choreography module, not a component.

---

## 3. Phased migration

Each phase compiles, builds, and visually verifies independently, and lands
as its own commit (or small commit series). Order chosen so the riskiest
mechanical moves happen before the structural rewrite.

### Phase 0 — Guardrails (½ session)

1. Record a baseline: `npm run build` output, plus a manual scroll-through
   checklist (see §4) captured once so later phases have a comparison point.
2. Add `npm run typecheck` (`tsc --noEmit`) if not already exposed as a script.
3. Add a minimal test harness (vitest or `node --test`, whichever is lighter
   here) with the first two invariant tests written **against current code**:
   - every `BEAT_SPACE` key matches a timeline item id or lodging slug in
     `days[]`, and vice-versa every timeline id has a case handled by
     `viewForBeat` (assert it doesn't return the day fallback for a sampled t);
   - `legT` boundaries are monotonically increasing 0→1.
   These tests are the safety net for Phase 3's big move; they get relocated,
   not rewritten, as files move.

### Phase 1 — Split the two grab-bag files in place (1 session)

No renames of layers yet — just make the pieces visible where they live.

1. `data/route.ts` → `data/places.ts`, `data/geometry/*.ts`, `data/markers.ts`,
   `data/clusters-data.ts`, keeping `data/route.ts` as a re-export barrel so
   nothing else changes yet.
2. `data/trip.ts` → `data/days.ts`, `data/destinations.ts`, `data/details.ts`,
   `data/essentials.ts`, `data/meta.ts`, again with `data/trip.ts` as a barrel.
3. Split `app/globals.css` into imported partials (`chrome.css`, `rail.css`,
   `beats.css`, `map.css`, `hero.css`, `base.css`) — pure move, no selector
   changes.

Verify: build + scroll-through. Commit.

### Phase 2 — Extract the engine skeleton (1 session)

1. Create `lib/engine/` and move the already-generic pieces verbatim:
   `geo.ts`, `motion.ts`, `palette.ts`, `basemap-style.ts` (to `map/`),
   `utils.ts` (`cn`).
2. Split `lib/journey/pacing.ts`: engine constants (`ANCHOR`, `FREEZE`,
   `HANDOFF`, `DAY_ANCHOR_*`, `DEFAULT_BEAT_SPACE`) → `lib/engine/pacing.ts`;
   `BEAT_SPACE`/`BEAT_HANDOFF` stay behind temporarily in a clearly named
   `data/pacing-overrides.ts` (they are trip content and will dissolve into
   day modules in Phase 3).
3. Split `lib/journey/cameras.ts`: `pose`, camera math → `lib/engine/camera.ts`
   (merging `transitions.ts`); `CITY`, `T`, `OVERVIEW`, flight views →
   `data/cameras.ts`.
4. Split `lib/journey/clusters.ts`: `clusterState` (parameterized by
   `stopClusters` argument instead of importing it) → engine; `CLUSTERS`
   groups → `data/`.
5. Keep `lib/journey-view.ts` re-exporting the same public names so
   `trip-shell`/`journey-map` don't churn in this phase.

Verify: build, tests, scroll-through. Commit.

### Phase 3 — Dissolve `beats.ts` into day modules (2–3 sessions; the heart of the refactor)

This is a mechanical-but-careful translation, one day at a time:

1. Add `DayModule`/`BeatDefinition`/`TripDefinition` types and
   `buildTripRegistry()` with validation (initially warning, flipped to
   throwing in dev once all ten days are migrated).
2. Rewrite `readJourneyView` / `readDayBeats` to take the registry (lookup
   `registry.beat(dayId, beatId)` instead of `viewForBeat` switch; beat spans
   come from the same registry, consumed by `Timeline` for `--beat-span`).
   During migration, the registry falls back to the old switch for
   not-yet-migrated days, so this can land day-by-day.
3. For each day 1→10: create `trip/days/day-NN-*.ts` (still under `data/days/`
   until Phase 5's rename, or create `trip/` now — do the rename first if it's
   cheap), moving:
   - the day's object out of `days[]`,
   - its `case` bodies out of `viewForBeat` and `viewForDay`,
   - its `BEAT_SPACE`/`BEAT_HANDOFF` entries.
   Shared helpers the day uses stay in/move to `trip/cameras.ts`.
4. Watch the cross-day seams: several beats hard-reference the *previous*
   day's ending camera (e.g. day 3+ `wombatMoment` starts `fromHofbrau`;
   `WOMBAT_ORBIT_END` → `leave-wombat`; `flight-out`'s handoff into day 2).
   These continuity constants move to `trip/cameras.ts` and get a short
   comment naming both days that depend on them. Scroll the seams
   specifically after each day migrates.
5. Delete `beats.ts`, `pacing-overrides.ts`, and the migration fallback once
   day 10 lands. Flip registry validation to throw in dev.

Verify after *each* day's migration: tests + scroll that day and both its
seams. Commit per day or per pair of days.

### Phase 4 — Split the two mega-components (1–2 sessions)

1. `journey-map.tsx` → keep the component as the owner of the MapLibre
   instance and marker refs; move pure/imperative helpers into
   `lib/engine/map/` (`layers.ts`, `markers.ts`, `camera-apply.ts`,
   `apply-view.ts`), each taking `(map, view, tripGeo)` style arguments
   instead of importing `data/route` directly. The component wires trip data
   into them — after this, `lib/engine/map/*` has zero `trip/` imports.
2. `trip-shell.tsx` → extract `use-scroll-sync.ts` (collect/measure/paint rAF
   loop + observers), `use-route-scroll.ts` (pathname effect), and the three
   chrome components (`trip-header`, `day-dots`, `skip-links`). `TripShell`
   becomes ~80 lines of composition.
3. `lib/paths.ts` → engine, parameterized by the trip's days (the
   `beatIdByDetail` map is built from data it's handed, not imported).

Verify: build, tests, full scroll-through on desktop + phone-width viewport
(the responsive zoom/pitch math moved — check Munich, Seceda, Venice frames).
Commit.

### Phase 5 — Rename to final layout + enforce the boundary (½ session)

1. Move `data/` → `trip/` (if not already done in Phase 3), delete barrels,
   update imports project-wide; add `@/trip/*` and `@/lib/engine/*` path
   aliases if helpful.
2. Enforce import direction with ESLint (`import/no-restricted-paths` or
   `no-restricted-imports`): nothing under `lib/engine/**` may import from
   `trip/**` or `components/**`; `trip/**` may not import `components/**`.
   This is the check that keeps the layers honest permanently.
3. Update `README.md` and `AGENTS.md`-adjacent docs: the three layers, where
   to edit what ("change what the trip *is* → `trip/days/`; change how it
   *moves* → same file, `beats`; change how it *looks* → `components/` + css").

### Phase 6 — Template-readiness pass (later, optional now)

Not part of the cleanup proper, but the direction the cleanup points at:

1. Write `trip/AUTHORING.md`: how to author a day module, the beat-id
   contract, how spans/pacing feel at different values, how to source routed
   geometry (Valhalla/OSM), photo + pin conventions, cluster semantics.
2. Grow registry validation into a `npm run check:trip` doctor: unreachable
   details, photo files that don't exist on disk, stops with no days, pins
   whose `focusId` never occurs, beat spans missing on real beats.
3. Extraction becomes mechanical: template = repo minus `trip/` contents plus
   a one-day example trip; skill = AUTHORING.md + doctor script driving the
   authoring loop. (Explicitly out of scope for this refactor — but every
   phase above is designed so this step is a copy, not another refactor.)

---

## 4. Verification strategy (no visual test suite exists — so be disciplined)

The site's correctness is mostly *felt* (camera choreography), so every phase
ends with the same manual pass, plus the invariant tests:

- **Scroll-through checklist**: hero → overview hold; day 1 flight draw; MUC
  arrival + airport train; Wombat walk-in and orbit; Englischer Garten walk;
  Hofbräuhaus orbit and its 0.9 handoff; Munich→Innsbruck ride; hut days'
  hike lines and pitched frames; Seceda summit; Val di Fassa; Venice; flight
  home with full-route clusters. Check three seams especially: day 2/3, day
  3/4 (leave-wombat picks up the orbit-end bearing), day 7/8.
- **Deep links**: `/day/6`, `/day/2/wombat-hostel`, `/destination/*`,
  `/essentials`, and back-to-`/` scroll restoration.
- **Responsive**: one pass at ~390px width (zoom offset + pitch damping paths).
- **Invariant tests** (from Phase 0, growing through Phase 3): beat-id
  contract completeness, `legT` monotonicity, `parseTripPath` cases,
  registry validation itself.
- `npm run build` (static params for all day/destination/detail routes must
  still generate) + `tsc --noEmit` after every phase.

## 5. Risks and mitigations

- **Beat translation drift** (Phase 3): a `case` body subtly depends on fall
  order or shared mutable-looking closure constants. Mitigation: migrate one
  day at a time with the fallback registry, diff the emitted `JourneyView`
  for sampled `t` values against the old switch (a throwaway test can run
  both implementations side-by-side during the migration and assert equality
  — delete it with the old switch).
- **Cross-day continuity constants** get separated from one of their two
  consumers. Mitigation: they all move to `trip/cameras.ts` with both
  consumers named; the seam checklist covers the felt behavior.
- **CSS split reordering** changes cascade outcomes. Mitigation: keep import
  order identical to original file order; no selector edits in the same
  commit as moves.
- **`next dev` AGENTS.md banner**: the repo's Next version diverges from
  training data — before touching route files or config in any phase, check
  `node_modules/next/dist/docs/` per AGENTS.md. (This plan keeps `app/`
  nearly untouched on purpose.)
- **Scope creep**: the doctor script, template extraction, and any visual
  regression tooling are Phase 6 — explicitly not blockers for the cleanup.

## 6. Success criteria

1. `lib/engine/**` contains zero trip-specific strings, ids, or coordinates,
   and the ESLint boundary rule proves it stays that way.
2. Adding day 11 to a hypothetical trip touches exactly: one new file in
   `trip/days/`, one line in `trip/index.ts`, and (if it visits new places)
   `trip/places.ts`/`trip/geometry/`.
3. A missing or misspelled beat id fails loudly in dev instead of silently
   showing a default camera.
4. No file over ~300 lines except geometry data.
5. The deployed site is pixel- and motion-identical to today.
