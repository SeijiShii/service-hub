import { describe, it, expect } from "vitest";
import {
  parsePeriod,
  periodToSinceIso,
  DEFAULT_PERIOD,
  CHART_PERIODS,
} from "./chartPeriod.js";

describe("chartPeriod (chart-ux 2026-06-08)", () => {
  describe("parsePeriod (allowlist 正規化)", () => {
    it("CX-U-40: 有効値はそのまま返す", () => {
      expect(parsePeriod("all")).toBe("all");
      expect(parsePeriod("30d")).toBe("30d");
      expect(parsePeriod("7d")).toBe("7d");
    });
    it("CX-U-41: 不正/未指定/空/配列 → 既定 30d (例外なし)", () => {
      expect(parsePeriod("foo")).toBe("30d");
      expect(parsePeriod(undefined)).toBe("30d");
      expect(parsePeriod("")).toBe("30d");
      expect(parsePeriod(["7d"])).toBe("30d");
      expect(parsePeriod(null)).toBe("30d");
      expect(DEFAULT_PERIOD).toBe("30d");
    });
  });

  describe("periodToSinceIso (since 算出)", () => {
    const now = new Date("2026-06-08T00:00:00.000Z").getTime();
    it("CX-U-42: 7d → now − 7日", () => {
      expect(periodToSinceIso("7d", now)).toBe("2026-06-01T00:00:00.000Z");
    });
    it("CX-U-43: 30d → now − 30日", () => {
      expect(periodToSinceIso("30d", now)).toBe("2026-05-09T00:00:00.000Z");
    });
    it("CX-U-44: all → epoch0 (全期間)", () => {
      expect(periodToSinceIso("all", now)).toBe("1970-01-01T00:00:00.000Z");
    });
  });

  it("CX-U-45: CHART_PERIODS = [全期間, 30日, 7日] の順", () => {
    expect(CHART_PERIODS.map((p) => p.value)).toEqual(["all", "30d", "7d"]);
    expect(CHART_PERIODS.map((p) => p.label)).toEqual(["全期間", "30日", "7日"]);
  });
});
