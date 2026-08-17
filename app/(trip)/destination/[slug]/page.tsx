import { notFound } from "next/navigation";
import { destinations, getDestination } from "@/data/trip";

export function generateStaticParams() {
  return destinations.map((destination) => ({ slug: destination.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.summary,
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getDestination(slug)) notFound();
  return null;
}
