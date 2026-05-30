import { describe, it, expect } from "vitest";
import { formatDeployAt } from "./deployAtFormat.js";

// last-deploy-col: epoch_ms (last_deploy_at) → 一覧「最終デプロイ」カラム表示用 JST 整形。
// 決定的 (now 非依存): epoch_ms から純粋導出するため vi.setSystemTime 不要。
describe("formatDeployAt (last-deploy-col)", () => {
  it("LDC-U-01: 有効な epoch_ms → JST (UTC+9) YYYY-MM-DD HH:MM", () => {
    // UTC 2026-05-29 00:00 → JST 2026-05-29 09:00
    const epoch = Date.UTC(2026, 4, 29, 0, 0, 0);
    expect(formatDeployAt(epoch)).toBe("2026-05-29 09:00");
  });

  it("LDC-U-20: JST 日付境界をまたぐ (UTC 15:00 = JST 翌 00:00)", () => {
    // UTC 2026-05-29 15:00 → JST 2026-05-30 00:00
    const epoch = Date.UTC(2026, 4, 29, 15, 0, 0);
    expect(formatDeployAt(epoch)).toBe("2026-05-30 00:00");
  });

  it("LDC-U-10: undefined / null → —", () => {
    expect(formatDeployAt(undefined)).toBe("—");
    expect(formatDeployAt(null)).toBe("—");
  });

  it("LDC-U-11: NaN / 不正 epoch → —", () => {
    expect(formatDeployAt(NaN)).toBe("—");
    expect(formatDeployAt(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("LDC-U-13: 0 / 負値 → — (adapters の createdAt 欠落時 value=0 防御)", () => {
    expect(formatDeployAt(0)).toBe("—");
    expect(formatDeployAt(-1)).toBe("—");
  });
});
