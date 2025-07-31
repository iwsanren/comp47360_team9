import { DateTime } from "luxon";

import getNextHourInNY from "../utils/getNextHourInNY";

describe("getNextHourInNY", () => {
  it("should return a Unix timestamp (in seconds) for the next full hour in New York", () => {
    const now = DateTime.now().setZone("America/New_York");
    const expected = now.plus({ hours: 1 }).startOf("hour").toSeconds();

    const result = getNextHourInNY();

    expect(Math.abs(result - expected)).toBeLessThanOrEqual(1);
  });

  it("should return a number", () => {
    const result = getNextHourInNY();
    expect(typeof result).toBe("number");
    expect(Number.isFinite(result)).toBe(true);
  });
});
