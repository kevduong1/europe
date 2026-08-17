import { notFound } from "next/navigation";
import { days, getDay, getDetailForDay } from "@/data/trip";

export function generateStaticParams() {
  return days.flatMap((day) => {
    const slugs = new Set<string>();
    slugs.add(day.lodging.slug);
    for (const item of day.timeline) {
      if ("detailSlug" in item && item.detailSlug) slugs.add(item.detailSlug);
    }
    return [...slugs].map((detail) => ({ day: String(day.id), detail }));
  });
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ day: string; detail: string }>;
}) {
  const { day: raw, detail } = await params;
  const record = getDetailForDay(Number(raw), detail);
  if (!record) return {};
  return {
    title: record.title,
    description: record.body,
  };
}

export default async function DetailPage({
  params,
}: {
  params: Promise<{ day: string; detail: string }>;
}) {
  const { day: raw, detail } = await params;
  const day = getDay(Number(raw));
  if (!day || !getDetailForDay(day.id, detail)) notFound();
  return null;
}
