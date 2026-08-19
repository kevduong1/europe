import { describe, expect, it } from "vitest";
import { beatIdForDetail, parseTripPath } from "@/trip";

describe("trip paths", () => {
  it.each([
    ["/", { view: "journey" }],
    ["/day/6", { view: "day", dayId: 6, detail: undefined }],
    [
      "/day/2/wombat-hostel",
      { view: "day", dayId: 2, detail: "wombat-hostel" },
    ],
    ["/destination/munich", { view: "journey", destination: "munich" }],
    ["/essentials", { view: "journey", essentials: true }],
    ["/day/not-a-number", { view: "journey" }],
    ["/day/99", { view: "journey" }],
  ])("parses %s", (path, expected) => {
    expect(parseTripPath(path)).toEqual(expected);
  });

  it("maps detail slugs to the authored beat contract", () => {
    expect(beatIdForDetail(3, "english-garden")).toBe("english-garden");
    expect(beatIdForDetail(7, "seceda-summit")).toBe("hike-firenze-seceda");
    expect(beatIdForDetail(2, "wombat-hostel")).toBe("wombat-hostel");
  });
});
