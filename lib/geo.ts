import type { LngLat } from "@/data/types";

export type { LngLat };

const EARTH_KM = 6371;

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toCartesian(point: LngLat): [number, number, number] {
  const lng = toRad(point[0]);
  const lat = toRad(point[1]);
  return [
    Math.cos(lat) * Math.cos(lng),
    Math.cos(lat) * Math.sin(lng),
    Math.sin(lat),
  ];
}

function fromCartesian(v: [number, number, number]): LngLat {
  const [x, y, z] = v;
  const lng = toDeg(Math.atan2(y, x));
  const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
  return [lng, lat];
}

export function greatCircle(a: LngLat, b: LngLat, n = 96): LngLat[] {
  const p1 = toCartesian(a);
  const p2 = toCartesian(b);
  const dot = Math.min(
    1,
    Math.max(-1, p1[0] * p2[0] + p1[1] * p2[1] + p1[2] * p2[2]),
  );
  const omega = Math.acos(dot);
  if (omega < 1e-8) return [a, b];
  const sinOmega = Math.sin(omega);
  const points: LngLat[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const s1 = Math.sin((1 - t) * omega) / sinOmega;
    const s2 = Math.sin(t * omega) / sinOmega;
    points.push(
      fromCartesian([
        p1[0] * s1 + p2[0] * s2,
        p1[1] * s1 + p2[1] * s2,
        p1[2] * s1 + p2[2] * s2,
      ]),
    );
  }
  return points;
}

export function lerpLngLat(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function densify(line: LngLat[], maxSegKm = 1.2): LngLat[] {
  if (line.length < 2) return line.slice();
  const out: LngLat[] = [line[0]];
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1];
    const b = line[i];
    const km = haversineKm(a, b);
    const steps = Math.max(1, Math.ceil(km / maxSegKm));
    for (let s = 1; s <= steps; s += 1) {
      out.push(lerpLngLat(a, b, s / steps));
    }
  }
  return out;
}

type LineMetrics = {
  /** Cumulative distance in km from the line start to each vertex. */
  cumulative: number[];
  total: number;
};

/**
 * Vertex distances are walked once per line and reused. The scroll loop calls
 * `along`/`sliceLine`/`pointsAlong` many times per frame on the same handful of
 * module-level route lines, so recomputing haversine per call is what makes the
 * trail update quadratic.
 */
const lineMetrics = new WeakMap<LngLat[], LineMetrics>();

function metricsFor(line: LngLat[]): LineMetrics {
  const cached = lineMetrics.get(line);
  if (cached) return cached;
  const cumulative: number[] = [];
  let total = 0;
  for (let i = 0; i < line.length; i += 1) {
    if (i > 0) total += haversineKm(line[i - 1], line[i]);
    cumulative.push(total);
  }
  const metrics: LineMetrics = { cumulative, total };
  lineMetrics.set(line, metrics);
  return metrics;
}

export function lineLengthKm(line: LngLat[]): number {
  return metricsFor(line).total;
}

/** Last vertex index whose cumulative distance is at or before `km`. */
function vertexAt(cumulative: number[], km: number): number {
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cumulative[mid] <= km) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function along(line: LngLat[], t: number): LngLat {
  if (line.length === 0) return [0, 0];
  if (line.length === 1 || t <= 0) return line[0];
  if (t >= 1) return line[line.length - 1];
  const { cumulative, total } = metricsFor(line);
  if (total === 0) return line[0];
  const target = t * total;
  const i = vertexAt(cumulative, target);
  if (i >= line.length - 1) return line[line.length - 1];
  const seg = cumulative[i + 1] - cumulative[i];
  if (seg === 0) return line[i];
  return lerpLngLat(line[i], line[i + 1], (target - cumulative[i]) / seg);
}

export function sliceLine(line: LngLat[], t0: number, t1: number): LngLat[] {
  const start = Math.min(t0, t1);
  const end = Math.max(t0, t1);
  const points: LngLat[] = [along(line, start)];
  const { cumulative, total } = metricsFor(line);
  if (total > 0) {
    for (let i = 1; i < line.length; i += 1) {
      const t = cumulative[i] / total;
      if (t >= end) break;
      if (t > start) points.push(line[i]);
    }
  }
  points.push(along(line, end));
  return points;
}

export function nearestT(line: LngLat[], point: LngLat): number {
  if (line.length < 2) return 0;
  const { cumulative, total } = metricsFor(line);
  if (total === 0) return 0;
  let bestD = Infinity;
  let bestT = 0;
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1];
    const b = line[i];
    const seg = cumulative[i] - cumulative[i - 1];
    const samples = 3;
    for (let s = 0; s <= samples; s += 1) {
      const u = s / samples;
      const candidate = lerpLngLat(a, b, u);
      const d = haversineKm(candidate, point);
      if (d < bestD) {
        bestD = d;
        bestT = (cumulative[i - 1] + seg * u) / total;
      }
    }
  }
  return bestT;
}

export function formatLngLat([lng, lat]: LngLat) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}  ${Math.abs(lng).toFixed(4)}°${ew}`;
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpBearing(a: number, b: number, t: number) {
  const diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

/** Initial bearing from A to B, degrees clockwise from north. */
export function bearingBetween(a: LngLat, b: LngLat): number {
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function smoothstep(t: number) {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
}

export function pointsAlong(line: LngLat[], t: number, spacingKm: number): LngLat[] {
  if (line.length < 2 || t <= 0.0001) return [];
  const { total } = metricsFor(line);
  if (total === 0) return [line[0]];
  const end = total * clamp(t);
  const points: LngLat[] = [];
  for (let d = 0; d <= end; d += spacingKm) {
    points.push(along(line, d / total));
  }
  const tip = along(line, clamp(t));
  const last = points[points.length - 1];
  if (!last || haversineKm(last, tip) > spacingKm * 0.25) points.push(tip);
  return points;
}

