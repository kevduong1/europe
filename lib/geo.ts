export type LngLat = [number, number];

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

export function lineLengthKm(line: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i += 1) {
    total += haversineKm(line[i - 1], line[i]);
  }
  return total;
}

export function along(line: LngLat[], t: number): LngLat {
  if (line.length === 0) return [0, 0];
  if (line.length === 1 || t <= 0) return line[0];
  if (t >= 1) return line[line.length - 1];
  const total = lineLengthKm(line);
  let remaining = t * total;
  for (let i = 1; i < line.length; i += 1) {
    const seg = haversineKm(line[i - 1], line[i]);
    if (seg === 0) continue;
    if (remaining <= seg) return lerpLngLat(line[i - 1], line[i], remaining / seg);
    remaining -= seg;
  }
  return line[line.length - 1];
}

export function sliceLine(line: LngLat[], t0: number, t1: number): LngLat[] {
  const start = Math.min(t0, t1);
  const end = Math.max(t0, t1);
  const points: LngLat[] = [along(line, start)];
  const total = lineLengthKm(line);
  let acc = 0;
  for (let i = 1; i < line.length; i += 1) {
    const prev = acc;
    acc += haversineKm(line[i - 1], line[i]);
    const t = acc / total;
    if (t > start && t < end) points.push(line[i]);
    if (prev / total < end && t >= end) break;
  }
  points.push(along(line, end));
  return points;
}

export function padBounds(
  bounds: [number, number, number, number],
  pad = 0.08,
): [number, number, number, number] {
  const [w, s, e, n] = bounds;
  const lngPad = (e - w) * pad;
  const latPad = (n - s) * pad;
  return [w - lngPad, s - latPad, e + lngPad, n + latPad];
}

export function nearestT(line: LngLat[], point: LngLat): number {
  if (line.length < 2) return 0;
  const total = lineLengthKm(line);
  if (total === 0) return 0;
  let bestD = Infinity;
  let bestT = 0;
  let acc = 0;
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1];
    const b = line[i];
    const seg = haversineKm(a, b);
    const samples = 3;
    for (let s = 0; s <= samples; s += 1) {
      const u = s / samples;
      const candidate = lerpLngLat(a, b, u);
      const d = haversineKm(candidate, point);
      if (d < bestD) {
        bestD = d;
        bestT = (acc + seg * u) / total;
      }
    }
    acc += seg;
  }
  return bestT;
}

export function centerOfBounds(
  bounds: [number, number, number, number],
): LngLat {
  return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
}

export function formatLngLat([lng, lat]: LngLat) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}  ${Math.abs(lng).toFixed(4)}°${ew}`;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpBounds(
  a: [number, number, number, number],
  b: [number, number, number, number],
  t: number,
): [number, number, number, number] {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
    lerp(a[3], b[3], t),
  ];
}

export function boundsOf(points: LngLat[]): [number, number, number, number] {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [lng, lat] of points) {
    w = Math.min(w, lng);
    s = Math.min(s, lat);
    e = Math.max(e, lng);
    n = Math.max(n, lat);
  }
  return [w, s, e, n];
}
