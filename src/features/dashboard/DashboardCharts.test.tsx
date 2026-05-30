import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardCharts } from "./DashboardCharts.js";
import type { DashboardChart } from "./summary.js";

const mkChart = (
  metricKey: DashboardChart["metricKey"],
  label: string,
  unit: string,
  seriesPoints: Array<[string, Array<{ capturedAt: string; value: number }>]>,
): DashboardChart => ({
  metricKey,
  label,
  unit,
  series: seriesPoints.map(([slug, points]) => ({
    slug,
    name: slug,
    points,
  })),
});

describe("DashboardCharts (biz-charts)", () => {
  it("BC-U-05: 4 chart render (ユーザー数/課金額/コスト/採算) — up/db_storage_bytes は除外", () => {
    const charts: DashboardChart[] = [
      mkChart("mau", "ユーザー数", "count", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 100 }]],
      ]),
      mkChart("revenue_month_usd", "課金額", "usd", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 50 }]],
      ]),
      mkChart("ai_cost_month_usd", "コスト", "usd", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 10 }]],
      ]),
      mkChart("profit", "採算", "usd", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 40 }]],
      ]),
    ];
    render(<DashboardCharts charts={charts} />);
    expect(screen.getByTestId("chart-mau")).not.toBeNull();
    expect(screen.getByTestId("chart-revenue_month_usd")).not.toBeNull();
    expect(screen.getByTestId("chart-ai_cost_month_usd")).not.toBeNull();
    expect(screen.getByTestId("chart-profit")).not.toBeNull();
    // 日本語ラベルが見出しに出る
    const section = screen.getByTestId("dashboard-charts") as HTMLElement;
    expect(section.textContent).toContain("ユーザー数");
    expect(section.textContent).toContain("課金額");
    expect(section.textContent).toContain("コスト");
    expect(section.textContent).toContain("採算");
    // 旧 chart は不在
    expect(screen.queryByTestId("chart-up")).toBeNull();
    expect(screen.queryByTestId("chart-db_storage_bytes")).toBeNull();
  });

  it("TS-U-31: section header「直近 30 日の推移」 + section testid", () => {
    const charts: DashboardChart[] = [
      mkChart("mau", "ユーザー数", "count", []),
    ];
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

  it("TS-U-32: 全 chart で series 空 → 各 chart で「データなし」表示、section 自体は render", () => {
    const charts: DashboardChart[] = [
      mkChart("mau", "ユーザー数", "count", []),
      mkChart("revenue_month_usd", "課金額", "usd", []),
      mkChart("ai_cost_month_usd", "コスト", "usd", []),
      mkChart("profit", "採算", "usd", []),
    ];
    render(<DashboardCharts charts={charts} />);
    expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-mau")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-revenue_month_usd")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-ai_cost_month_usd")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-profit")).not.toBeNull();
    expect(screen.queryByTestId("chart-empty-up")).toBeNull();
  });

  it("TS-U-32b: charts=[] (空配列) でも section + header は render (チャート部分のみ空)", () => {
    render(<DashboardCharts charts={[]} />);
    expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
    expect(screen.getByTestId("dashboard-charts").textContent).toContain(
      "直近 30 日の推移",
    );
  });
});
