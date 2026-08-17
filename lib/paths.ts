import { days } from "@/data/trip";

export type TripRoute =
  | { view: "journey"; destination?: string; essentials?: boolean }
  | { view: "day"; dayId: number; detail?: string };

/**
 * Detail slug -> the `data-beat` to scroll to, keyed by day because the same
 * slug appears on several days (`flight-mci-muc` on days 1 and 2, `wombat-hostel`
 * on 2, 3 and 4) and each should land on its own day's beat.
 *
 * Lodging deliberately wins over a timeline item sharing its slug: a link to
 * `rifugio-resciesa` should land on the night at the hut, not on the hike that
 * got you there.
 */
const beatIdByDetail = new Map<string, string>();

for (const day of days) {
  for (const item of day.timeline) {
    if (!("detailSlug" in item) || !item.detailSlug) continue;
    const key = `${day.id}/${item.detailSlug}`;
    if (!beatIdByDetail.has(key)) beatIdByDetail.set(key, item.id);
  }
  beatIdByDetail.set(`${day.id}/${day.lodging.slug}`, day.lodging.slug);
}

export function beatIdForDetail(dayId: number, detail: string) {
  return beatIdByDetail.get(`${dayId}/${detail}`) ?? null;
}

export function parseTripPath(pathname: string): TripRoute {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "essentials") {
    return { view: "journey", essentials: true };
  }

  if (parts[0] === "destination" && parts[1]) {
    return { view: "journey", destination: parts[1] };
  }

  if (parts[0] === "day" && parts[1]) {
    const dayId = Number(parts[1]);
    if (!Number.isInteger(dayId)) return { view: "journey" };
    return { view: "day", dayId, detail: parts[2] };
  }

  return { view: "journey" };
}
