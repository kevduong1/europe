import { describe, expect, it } from "vitest";
import { buildTripRegistry, renderedBeatIds } from "@/lib/engine/registry";
import type { DayModule } from "@/lib/engine/types";
import { dayModules, registry } from "@/trip";

describe("trip registry", () => {
  it("has exactly one camera definition for every rendered beat", () => {
    for (const dayModule of dayModules) {
      expect(Object.keys(dayModule.beats).sort()).toEqual(
        renderedBeatIds(dayModule.day).sort(),
      );
    }
  });

  it("produces complete finite camera frames at representative progress values", () => {
    for (const dayModule of dayModules) {
      for (const beat of Object.values(dayModule.beats)) {
        for (const progress of [0, 0.5, 1]) {
          const view = beat.view(progress);
          expect([
            ...view.center,
            view.zoom,
            view.pitch,
            view.bearing,
            view.flightT,
            view.trailT,
            view.localRouteT,
          ].every(Number.isFinite)).toBe(true);
        }
      }
    }
  });

  it("throws instead of silently accepting a missing beat", () => {
    const invalid: DayModule = {
      ...dayModules[0],
      beats: {},
    };
    expect(() => buildTripRegistry([invalid], registry.overview)).toThrow(
      /missing beat/,
    );
  });
});
