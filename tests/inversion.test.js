import { describe, expect, it } from "vitest";
import {
  assessInversion,
  inferDiurnalPeriod,
  localClockFromOffset,
  ventilationVerdict,
} from "../src/inversion.js";

describe("inferDiurnalPeriod", () => {
  it("detects evening when sun is down at 6pm", () => {
    expect(inferDiurnalPeriod(18, 0)).toBe("evening");
  });

  it("detects midday when sun is up", () => {
    expect(inferDiurnalPeriod(14, 1)).toBe("midday");
  });
});

describe("assessInversion", () => {
  it("flags active inversion from temperature gradient at night", () => {
    const result = assessInversion({
      temp2m: 8,
      temp80m: 12,
      localHour: 6,
      month: 6,
      isDay: 0,
    });
    expect(result.phase).toBe("active");
    expect(result.period).toBe("morning");
    expect(result.gradientC).toBe(4);
  });

  it("flags evening inversion forming at 6pm when cooling", () => {
    const result = assessInversion({
      temp2m: 15.7,
      temp80m: 16.3,
      localHour: 18,
      month: 7,
      isDay: 0,
    });
    expect(result.period).toBe("evening");
    expect(result.phase).toBe("active");
    expect(result.label).toContain("evening");
  });

  it("flags well mixed midday when surface is warmer than air aloft", () => {
    const result = assessInversion({
      temp2m: 22,
      temp80m: 19,
      localHour: 15,
      month: 1,
      isDay: 1,
    });
    expect(result.phase).toBe("unlikely");
    expect(result.period).toBe("midday");
  });

  it("falls back to time-of-day when temps are missing", () => {
    const winterMorning = assessInversion({
      temp2m: null,
      temp80m: null,
      localHour: 7,
      month: 6,
      isDay: 0,
    });
    expect(winterMorning.phase).toBe("active");

    const summerAfternoon = assessInversion({
      temp2m: null,
      temp80m: null,
      localHour: 15,
      month: 1,
      isDay: 1,
    });
    expect(summerAfternoon.phase).toBe("unlikely");
  });
});

describe("ventilationVerdict", () => {
  const activeMorning = assessInversion({ temp2m: 8, temp80m: 11, localHour: 6, month: 6, isDay: 0 });

  it("discourages ventilation during active inversion even if outdoor PM is lower", () => {
    const v = ventilationVerdict(40, 20, activeMorning);
    expect(v.title).toBe("Wait to ventilate");
    expect(v.text).toMatch(/inversion/i);
  });

  it("discourages evening ventilation when inversion is forming", () => {
    const evening = assessInversion({
      temp2m: 15.7,
      temp80m: 16.3,
      localHour: 18,
      month: 7,
      isDay: 0,
    });
    const v = ventilationVerdict(30, 25, evening);
    expect(v.title).toMatch(/Don't ventilate|forming|closed/i);
    expect(v.text).toMatch(/evening|cooling/i);
  });

  it("recommends ventilation when well mixed and outdoor is cleaner", () => {
    const mixed = assessInversion({ temp2m: 20, temp80m: 19, localHour: 15, month: 1, isDay: 1 });
    const v = ventilationVerdict(40, 20, mixed);
    expect(v.title).toBe("Ventilation can help");
  });

  it("recommends opening windows when morning inversion is breaking and outdoor is cleaner", () => {
    const breaking = assessInversion({
      temp2m: 11,
      temp80m: 11,
      localHour: 10,
      month: 1,
      isDay: 1,
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
