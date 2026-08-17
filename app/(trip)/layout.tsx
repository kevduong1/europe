import { TripShell } from "@/components/trip-shell";

export default function TripLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TripShell />
      {children}
    </>
  );
}
