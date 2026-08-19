import type { Day } from "./types";

export type TripRoute =
  | { view: "journey"; destination?: string; essentials?: boolean }
  | { view: "day"; dayId: number; detail?: string };

export function buildBeatIdForDetail(days: readonly Day[]) {
  const beatIdByDetail = new Map<string, string>();
  for (const day of days) {
    for (const item of day.timeline) {
      if (!("detailSlug" in item) || !item.detailSlug) continue;
      const key = `${day.id}/${item.detailSlug}`;
      if (!beatIdByDetail.has(key)) beatIdByDetail.set(key, item.id);
    }
    beatIdByDetail.set(`${day.id}/${day.lodging.slug}`, day.lodging.slug);
  }
  return (dayId: number, detail: string) =>
    beatIdByDetail.get(`${dayId}/${detail}`) ?? null;
}

export function parseTripPath(
  pathname: string,
  days?: readonly Day[],
): TripRoute {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "essentials") return { view: "journey", essentials: true };
  if (parts[0] === "destination" && parts[1]) {
    return { view: "journey", destination: parts[1] };
  }
  if (parts[0] === "day" && parts[1]) {
    const dayId = Number(parts[1]);
    const known = !days || days.some((day) => day.id === dayId);
    if (!Number.isInteger(dayId) || !known) return { view: "journey" };
    return { view: "day", dayId, detail: parts[2] };
  }
  return { view: "journey" };
}
