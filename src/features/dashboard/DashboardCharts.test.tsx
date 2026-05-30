import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardCharts } from "./DashboardCharts.js";
import type { DashboardChart } from "./summary.js";

const mkChart = (
  metricKey: DashboardChart["metricKey"],
  unit: string,
  seriesPoints: Array<[string, Array<{ capturedAt: string; value: number }>]>,
): DashboardChart => ({
  metricKey,
  unit,
  series: seriesPoints.map(([slug, points]) => ({
    slug,
    name: slug,
    points,
  })),
});

describe("DashboardCharts (timeseries-topchart、spec-review R4)", () => {
  it("TS-U-30: 3 chart render (up / mau / db_storage_bytes) — last_deploy_at は除外 (last-deploy-col)", () => {
    const charts: DashboardChart[] = [
      mkChart("up", "bool", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 1 }]],
      ]),
      mkChart("mau", "count", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 100 }]],
      ]),
      mkChart("db_storage_bytes", "bytes", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 999 }]],
      ]),
    ];
    render(<DashboardCharts charts={charts} />);
    expect(screen.getByTestId("chart-up")).not.toBeNull();
    expect(screen.getByTestId("chart-mau")).not.toBeNull();
    expect(screen.getByTestId("chart-db_storage_bytes")).not.toBeNull();
    // last-deploy-col: last_deploy_at は chart 表示せず一覧カラムへ移設 → chart 不在
    expect(screen.queryByTestId("chart-last_deploy_at")).toBeNull();
  });

  it("TS-U-31: section header「直近 30 日の推移」 + section testid", () => {
    const charts: DashboardChart[] = [mkChart("up", "bool", [])];
    render(<DashboardCharts charts={charts} />);
    const section = screen.getByTestId("dashboard-charts") as HTMLElement;
    expect(section).not.toBeNull();
    expect(section.textContent).toContain("直近 30 日の推移");
    // ⚠️ jsdom 制約: React inline style で CSS var (`var(--border, ...)`) を含む `borderBottom`
    // shorthand は style attribute から完全に除去される (jsdom CSS parser が var() を弾く)。
    // 実装側では正しく設定済 (本番ブラウザで適用)、jsdom テストでは visual style assertion は省略。
    // h2 要素の存在で section header が正しく render されたことを担保
    const heading = section.querySelector("h2");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("直近 30 日の推移");
  });

  it("TS-U-32: 全 chart で series 空 (空 chartSnapshots 状態) → 各 chart で「データなし」表示、section 自体は render", () => {
    const charts: DashboardChart[] = [
      mkChart("up", "bool", []),
      mkChart("mau", "count", []),
      mkChart("db_storage_bytes", "bytes", []),
    ];
    render(<DashboardCharts charts={charts} />);
    expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-up")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-mau")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-db_storage_bytes")).not.toBeNull();
    expect(screen.queryByTestId("chart-empty-last_deploy_at")).toBeNull();
  });

  it("TS-U-32b: charts=[] (空配列) でも section + header は render (チャート部分のみ空)", () => {
    render(<DashboardCharts charts={[]} />);
    expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
    expect(screen.getByTestId("dashboard-charts").textContent).toContain(
      "直近 30 日の推移",
    );
  });
});
