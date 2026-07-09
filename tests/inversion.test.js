import { describe, expect, it } from "vitest";
import {
  assessInversion,
  localClockFromOffset,
  ventilationVerdict,
} from "../src/inversion.js";

describe("assessInversion", () => {
  it("flags active inversion from temperature gradient at night", () => {
    const result = assessInversion({
      temp2m: 8,
      temp80m: 12,
      localHour: 6,
      month: 6,
    });
    expect(result.phase).toBe("active");
    expect(result.gradientC).toBe(4);
  });

  it("flags unlikely when surface is warmer than air aloft in afternoon", () => {
    const result = assessInversion({
      temp2m: 22,
      temp80m: 19,
      localHour: 15,
      month: 1,
    });
    expect(result.phase).toBe("unlikely");
  });

  it("falls back to time-of-day when temps are missing", () => {
    const winterMorning = assessInversion({
      temp2m: null,
      temp80m: null,
      localHour: 7,
      month: 6,
    });
    expect(winterMorning.phase).toBe("active");

    const summerAfternoon = assessInversion({
      temp2m: null,
      temp80m: null,
      localHour: 15,
      month: 1,
    });
    expect(summerAfternoon.phase).toBe("unlikely");
  });
});

describe("ventilationVerdict", () => {
  const active = assessInversion({ temp2m: 8, temp80m: 11, localHour: 6, month: 6 });

  it("discourages ventilation during active inversion even if outdoor PM is lower", () => {
    const v = ventilationVerdict(40, 20, active);
    expect(v.title).toBe("Wait to ventilate");
    expect(v.text).toMatch(/inversion/i);
  });

  it("recommends ventilation when inversion is weak and outdoor is cleaner", () => {
    const mixed = assessInversion({ temp2m: 20, temp80m: 19, localHour: 15, month: 1 });
    const v = ventilationVerdict(40, 20, mixed);
    expect(v.title).toBe("Ventilation can help");
  });

  it("recommends opening windows when inversion is breaking and outdoor is cleaner", () => {
    const breaking = assessInversion({
      temp2m: null,
      temp80m: null,
      localHour: 8,
      month: 1,
    });
    expect(breaking.phase).toBe("breaking");
    const v = ventilationVerdict(35, 18, breaking);
    expect(v.title).toBe("Good window opening");
  });
});

describe("localClockFromOffset", () => {
  it("returns hour and month from utc offset", () => {
    const { localHour, month } = localClockFromOffset(0);
    expect(localHour).toBeGreaterThanOrEqual(0);
    expect(localHour).toBeLessThanOrEqual(23);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });
});
