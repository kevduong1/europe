export type TripRoute =
  | { view: "journey"; destination?: string; essentials?: boolean }
  | { view: "day"; dayId: number; detail?: string };

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
