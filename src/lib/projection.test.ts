import { describe, it, expect } from "vitest";
import { projectAhead } from "./projection.js";

describe("projectAhead (business-observability Phase C, trend 外挿)", () => {
  it("BO-PJ1: 線形増 [2,4,6] → 1/2/3ヶ月後 = 8,10,12", () => {
    expect(projectAhead([2, 4, 6], [1, 2, 3])).toEqual([8, 10, 12]);
  });
  it("BO-PJ2: 1点のみ → 外挿不可 (全 null)", () => {
    expect(projectAhead([5], [1, 2, 3])).toEqual([null, null, null]);
  });
  it("BO-PJ2b: 0点 → 全 null", () => {
    expect(projectAhead([], [1])).toEqual([null]);
  });
  it("BO-PJ3: フラット [5,5,5] → 5,5,5", () => {
    expect(projectAhead([5, 5, 5], [1, 2, 3])).toEqual([5, 5, 5]);
  });
  it("BO-PJ4: ノイズありでも最小二乗で傾き推定", () => {
    // [1,2,3,4] slope=1, intercept=1 → index4 = 5
    expect(projectAhead([1, 2, 3, 4], [1])).toEqual([5]);
  });
});
