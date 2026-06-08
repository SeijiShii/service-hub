import { describe, it, expect } from "vitest";
import { CHART_SERIES_COLORS, chartSeriesColor } from "./tokens.js";

/**
 * chart 線色 palette のバリエーション拡充 (revise chart-colors 2026-06-08)。
 * 色相環の自然順 (青→シアン→緑…) では先頭3色が青〜緑に固まり 2〜3 series で
 * 「青と緑だけ」に見える + シアン#34d3a0 ≈ 緑#34d399 が near-dup だった。
 * → 暖寒交互順に並べ替え + near-dup 解消 (8 色維持) を不変条件として固定する。
 */
describe("tokens: CHART_SERIES_COLORS (chart-colors palette)", () => {
  /** `var(--x, #hex)` 形式から fallback hex を小文字で取り出す。 */
  const hexOf = (token: string): string => {
    const m = token.match(/#([0-9a-fA-F]{6})/);
    return m ? `#${m[1].toLowerCase()}` : token.toLowerCase();
  };

  it("TK-U-01: 8 色である", () => {
    expect(CHART_SERIES_COLORS.length).toBe(8);
  });

  it("TK-U-02: idx0 は青 #5b9cf5 据置 (single-series/service-detail 互換)", () => {
    expect(hexOf(chartSeriesColor(0))).toBe("#5b9cf5");
  });

  it("TK-U-03: idx1 は暖色 (橙 #fb923c) — 先頭の寒色固まりを解消", () => {
    expect(hexOf(chartSeriesColor(1))).toBe("#fb923c");
  });

  it("TK-U-04: idx0..3 は青/橙/緑/ピンクの暖寒交互順", () => {
    expect([0, 1, 2, 3].map((i) => hexOf(chartSeriesColor(i)))).toEqual([
      "#5b9cf5", // 青 (寒)
      "#fb923c", // 橙 (暖)
      "#34d399", // 緑 (寒)
      "#ec4899", // ピンク (暖)
    ]);
  });

  it("TK-U-07: 全色が相異なる (near-dup #34d3a0/#34d399 並存を解消)", () => {
    const hexes = CHART_SERIES_COLORS.map(hexOf);
    expect(new Set(hexes).size).toBe(8);
    // 旧 near-dup のシアン #34d3a0 は廃止されていること
    expect(hexes).not.toContain("#34d3a0");
  });

  it("TK-U-04b: idx8 は idx0 に循環 (index % 8)", () => {
    expect(chartSeriesColor(8)).toBe(chartSeriesColor(0));
    expect(chartSeriesColor(10)).toBe(chartSeriesColor(2));
  });
});
