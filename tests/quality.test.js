import { describe, expect, it } from "vitest";
import {
  categoryFor,
  exerciseVerdict,
  extractCurrent,
  ozoneLevel,
  pm25Tier,
  purifierVerdict,
} from "../src/quality.js";

describe("pm25Tier", () => {
  it("returns unknown for null/NaN", () => {
    expect(pm25Tier(null).key).toBe("unknown");
    expect(pm25Tier(NaN).key).toBe("unknown");
  });

  it("maps WHO guideline boundary", () => {
    expect(pm25Tier(15).key).toBe("good");
    expect(pm25Tier(15.1).key).toBe("moderate");
  });

  it("clamps negative values to good", () => {
    expect(pm25Tier(-5).key).toBe("good");
  });

  it("maps extreme concentrations", () => {
    expect(pm25Tier(200).key).toBe("extreme");
  });
});

describe("ozoneLevel", () => {
  it("returns null for missing data", () => {
    expect(ozoneLevel(null)).toBeNull();
  });

  it("maps WHO ozone breakpoints", () => {
    expect(ozoneLevel(100)).toBe(0);
    expect(ozoneLevel(160)).toBe(1);
    expect(ozoneLevel(200)).toBe(3);
  });
});

describe("categoryFor", () => {
  it("returns unknown for null level", () => {
    expect(categoryFor(null).key).toBe("unknown");
  });

  it("resolves ordinal levels", () => {
    expect(categoryFor(0).key).toBe("good");
    expect(categoryFor(5).key).toBe("extreme");
  });
});

describe("exerciseVerdict", () => {
  it("waits when no levels", () => {
    expect(exerciseVerdict(null, null).title).toBe("No data yet");
  });

  it("recommends outdoor exercise at good levels", () => {
    expect(exerciseVerdict(0, 0).title).toBe("Good to go");
  });

  it("uses the worse of PM2.5 and ozone", () => {
    const v = exerciseVerdict(0, 3);
    expect(v.title).toBe("Take it indoors");
    expect(v.text).toContain("ozone");
  });
});

describe("purifierVerdict", () => {
  it("asks for a reading when indoor PM is missing", () => {
    expect(purifierVerdict(null, 10).title).toBe("Add a reading");
  });

  it("suggests ventilation when outside is much cleaner", () => {
    const v = purifierVerdict(60, 10);
    expect(v.title).toBe("Turn it on");
    expect(v.text).toContain("cross-ventilation");
  });

  it("suggests keeping windows closed when outside is worse", () => {
    const v = purifierVerdict(10, 40);
    expect(v.text).toContain("keep windows closed");
  });
});

describe("extractCurrent", () => {
  it("prefers the current block when present", () => {
    const slice = extractCurrent({
      current: { pm2_5: 12, pm10: 20, us_aqi: 45, ozone: 80 },
    });
    expect(slice.pm2_5).toBe(12);
    expect(slice.ozone).toBe(80);
  });

  it("picks the latest hourly slot at or before now", () => {
    const slice = extractCurrent({
      utc_offset_seconds: 0,
      hourly: {
        time: ["2026-01-01T10:00", "2026-01-01T11:00", "2026-01-01T12:00"],
        pm2_5: [10, 20, 30],
        ozone: [50, 60, 70],
      },
    });
    expect(slice.pm2_5).toBeGreaterThan(0);
    expect(slice.ozone).toBeGreaterThan(0);
  });
});
