import { expect, it } from "vitest";
import { legT } from "@/trip/geometry/legs";

it("keeps trail leg boundaries monotonic from zero to one", () => {
  const boundaries = Object.values(legT);
  expect(boundaries[0].start).toBeCloseTo(0, 12);
  expect(boundaries.at(-1)?.end).toBeCloseTo(1, 12);
  for (let index = 0; index < boundaries.length; index += 1) {
    const current = boundaries[index];
    expect(current.start).toBeLessThanOrEqual(current.end);
    if (index > 0) {
      expect(current.start).toBeCloseTo(boundaries[index - 1].end, 12);
    }
  }
});
