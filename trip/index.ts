import { buildBeatIdForDetail, parseTripPath as parsePath } from "@/lib/engine/paths";
import { buildTripRegistry } from "@/lib/engine/registry";
import type { DetailRecord, Destination, TripDefinition } from "@/lib/engine/types";
import { OVERVIEW } from "./cameras";
import { day1 } from "./days/day-01-fly-out";
import { day2 } from "./days/day-02-landing-munich";
import { day3 } from "./days/day-03-munich";
import { day4 } from "./days/day-04-innsbruck";
import { day5 } from "./days/day-05-into-the-dolomites";
import { day6 } from "./days/day-06-resciesa-firenze";
import { day7 } from "./days/day-07-seceda";
import { day8 } from "./days/day-08-val-di-fassa";
import { day9 } from "./days/day-09-venice";
import { day10 } from "./days/day-10-flight-home";
import { destinations } from "./destinations";
import { details } from "./details";
import { essentials } from "./essentials";
import { meta } from "./meta";

export const dayModules = [
  day1,
  day2,
  day3,
  day4,
  day5,
  day6,
  day7,
  day8,
  day9,
  day10,
] as const;

export const registry = buildTripRegistry(dayModules, OVERVIEW);
export const days = registry.days;
export const trip = meta;

const destinationBySlug = new Map<string, Destination>(
  destinations.map((destination) => [destination.slug, destination]),
);
const detailBySlug = new Map<string, DetailRecord>();
const detailByDayAndSlug = new Map<string, DetailRecord>();
for (const detail of details) {
  detailBySlug.set(detail.slug, detail);
  detailByDayAndSlug.set(`${detail.dayId}/${detail.slug}`, detail);
}

export function getDay(id: number) {
  return registry.day(id)?.day;
}

export function getDestination(slug: string) {
  return destinationBySlug.get(slug);
}

export function getDetailForDay(dayId: number, slug: string) {
  return detailByDayAndSlug.get(`${dayId}/${slug}`) ?? detailBySlug.get(slug);
}

export const beatIdForDetail = buildBeatIdForDetail(days);
export const parseTripPath = (pathname: string) => parsePath(pathname, days);

export const tripDefinition: TripDefinition = {
  meta,
  dayModules,
  days,
  destinations,
  essentials,
  details,
  registry,
};

export { destinations, details, essentials, meta };
export { OVERVIEW } from "./cameras";
