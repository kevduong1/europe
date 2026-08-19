import { notFound } from "next/navigation";
import { days, getDay } from "@/trip";

export function generateStaticParams() {
  return days.map((day) => ({ day: String(day.id) }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: raw } = await params;
  const day = getDay(Number(raw));
  if (!day) return {};
  return {
    title: `Day ${day.id} · ${day.title}`,
    description: day.summary,
  };
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: raw } = await params;
  if (!getDay(Number(raw))) notFound();
  return null;
}
