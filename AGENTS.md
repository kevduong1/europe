<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project architecture

Keep imports flowing in one direction: `app → components → trip → lib/engine`.

- Change itinerary content, pacing, or camera choreography in the matching `trip/days/` module.
- Change trip coordinates, route geometry, map markers, or photos under `trip/`.
- Keep `lib/engine/` free of trip-specific IDs, labels, and coordinates.
- Change rendering and styling under `components/` and `app/styles/`.
- Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` after structural changes.
