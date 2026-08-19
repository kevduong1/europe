# Europe 2026

Mobile-first trip companion for *Munich · Innsbruck · Dolomites · Venice, Sept 5–14, 2026*.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

The app has three one-way layers:

```text
app → components → trip → lib/engine
```

- `lib/engine/` contains reusable scroll, camera, registry, path, and map primitives. It cannot import trip content or presentation components.
- `trip/` contains everything specific to Europe 2026: one module per day, itinerary copy, camera choreography, pacing, geometry, markers, and photos.
- `components/` renders the trip and owns client-side composition. MapLibre helpers live in the engine; the map component only owns the map instance.

To change what the trip is or how a day moves, edit that day in `trip/days/`. To add or correct coordinates and routes, edit `trip/places.ts` or `trip/geometry/`. To change presentation, edit `components/` and the imported partials in `app/styles/`.

Each `DayModule` defines its displayed content, opening camera, and every beat's camera function and scroll space. `buildTripRegistry()` validates the beat IDs against the rows the timeline actually renders, so a missing or misspelled beat fails during development and builds.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
```
