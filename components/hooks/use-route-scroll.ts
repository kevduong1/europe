"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  beatIdForDetail,
  getDestination,
  parseTripPath,
} from "@/trip";

function targetForPath(pathname: string) {
  const route = parseTripPath(pathname);
  if (route.view === "journey" && route.essentials) {
    return document.getElementById("essentials");
  }
  if (route.view === "day") {
    const section = document.getElementById(`day-${route.dayId}`);
    const beatId = route.detail
      ? beatIdForDetail(route.dayId, route.detail)
      : null;
    const beat = beatId
      ? section?.querySelector<HTMLElement>(`[data-beat="${beatId}"]`)
      : null;
    return beat ?? section;
  }
  if (route.view === "journey" && route.destination) {
    const destination = getDestination(route.destination);
    if (destination) {
      return document.getElementById(`day-${destination.dayIds[0]}`);
    }
  }
  return null;
}

export function useRouteScroll(syncChrome: () => void, syncAll: () => void) {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    const target = targetForPath(pathname);
    const afterScroll = () => {
      requestAnimationFrame(() => {
        syncChrome();
        syncAll();
      });
    };
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      afterScroll();
      return;
    }
    if (previous && previous !== "/" && pathname === "/") {
      window.scrollTo({ top: 0, behavior: "auto" });
      afterScroll();
    }
  }, [pathname, syncChrome, syncAll]);
}
