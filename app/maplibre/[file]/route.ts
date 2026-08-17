import { readFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED = new Set([
  "maplibre-gl-worker.mjs",
  "maplibre-gl-shared.mjs",
]);

export function generateStaticParams() {
  return [...ALLOWED].map((file) => ({ file }));
}

export const dynamicParams = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!ALLOWED.has(file)) {
    return new Response("Not found", { status: 404 });
  }

  const buf = await readFile(
    path.join(process.cwd(), "node_modules/maplibre-gl/dist", file),
  );

  return new Response(buf, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
