import { days } from "@/data/trip";

export type TripRoute =
  | { view: "journey"; destination?: string; essentials?: boolean }
  | { view: "day"; dayId: number; detail?: string; destination?: string };

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
    const detail = parts[2];
    return { view: "day", dayId, detail };
  }

  return { view: "journey" };
}

export function dayHref(dayId: number, detail?: string) {
  return detail ? `/day/${dayId}/${detail}` : `/day/${dayId}`;
}

export function destinationHref(slug: string) {
  return `/destination/${slug}`;
}

export function parentPath(pathname: string) {
  const route = parseTripPath(pathname);
  if (route.view === "day" && route.detail) return dayHref(route.dayId);
  if (route.view === "journey" && (route.destination || route.essentials)) {
    return "/";
  }
  if (route.view === "day") return "/";
  return "/";
}

export function isValidDayId(id: number) {
  return days.some((day) => day.id === id);
}
