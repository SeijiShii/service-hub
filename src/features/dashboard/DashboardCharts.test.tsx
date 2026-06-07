import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCharts, sharedXDomain } from "./DashboardCharts.js";
import { bucketEpoch } from "../../components/MetricChart.js";
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

describe("DashboardCharts (chart-ux 2026-06-08)", () => {
  it("CX-U-10: 2 chart render (ユーザー数/収益) — usd 系 3 chart は不在", () => {
    const charts: DashboardChart[] = [
      mkChart("mau", "ユーザー数", "count", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 100 }]],
      ]),
      mkChart("revenue_total_yen", "収益", "jpy", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 200 }]],
      ]),
    ];
    render(<DashboardCharts charts={charts} />);
    expect(screen.getByTestId("chart-mau")).not.toBeNull();
    expect(screen.getByTestId("chart-revenue_total_yen")).not.toBeNull();
    const section = screen.getByTestId("dashboard-charts") as HTMLElement;
    expect(section.textContent).toContain("ユーザー数");
    expect(section.textContent).toContain("収益");
    // 削除した usd 系 chart は不在
    expect(screen.queryByTestId("chart-revenue_month_usd")).toBeNull();
    expect(screen.queryByTestId("chart-ai_cost_month_usd")).toBeNull();
    expect(screen.queryByTestId("chart-profit")).toBeNull();
  });

  it("CX-U-11: 共有時間軸 — 全 chart に同一 data-domain (点範囲が異なっても揃う)", () => {
    const charts: DashboardChart[] = [
      // mau は 05-10 のみ
      mkChart("mau", "ユーザー数", "count", [
        ["a", [{ capturedAt: "2026-05-10T00:00:00Z", value: 100 }]],
      ]),
      // 収益は 05-08 〜 05-12 (より広い)
      mkChart("revenue_total_yen", "収益", "jpy", [
        [
          "a",
          [
            { capturedAt: "2026-05-08T00:00:00Z", value: 10 },
            { capturedAt: "2026-05-12T00:00:00Z", value: 20 },
          ],
        ],
      ]),
    ];
    render(<DashboardCharts charts={charts} />);
    const d1 = screen.getByTestId("chart-mau").getAttribute("data-domain");
    const d2 = screen
      .getByTestId("chart-revenue_total_yen")
      .getAttribute("data-domain");
    // union [05-08, 05-12] が両方に渡る
    const expected = `${bucketEpoch("2026-05-08T00:00:00Z")},${bucketEpoch(
      "2026-05-12T00:00:00Z",
    )}`;
    expect(d1).toBe(expected);
    expect(d2).toBe(expected);
    expect(d1).toBe(d2);
  });

  it("CX-U-12: 全 series 空 → 各 chart「データなし」、data-domain なし、section は render", () => {
    const charts: DashboardChart[] = [
      mkChart("mau", "ユーザー数", "count", []),
      mkChart("revenue_total_yen", "収益", "jpy", []),
    ];
    render(<DashboardCharts charts={charts} />);
    expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-mau")).not.toBeNull();
    expect(screen.getByTestId("chart-empty-revenue_total_yen")).not.toBeNull();
    expect(
      screen.getByTestId("chart-mau").getAttribute("data-domain"),
    ).toBeNull();
  });

  it("CX-U-13: charts=[] (空配列) でも section + header は render", () => {
    render(<DashboardCharts charts={[]} />);
    expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
    const heading = screen
      .getByTestId("dashboard-charts")
      .querySelector("h2");
    expect(heading).not.toBeNull();
  });

  // ── 期間セレクタ (Phase 3) ──
  it("CX-U-20: 期間セレクタ (全期間/30日/7日) が render、選択中 period が active", () => {
    render(
      <DashboardCharts charts={[]} period="30d" onPeriodChange={() => {}} />,
    );
    const selector = screen.getByTestId("chart-period-selector");
    expect(selector).not.toBeNull();
    expect(selector.textContent).toContain("全期間");
    expect(selector.textContent).toContain("30日");
    expect(selector.textContent).toContain("7日");
    expect(
      screen.getByTestId("chart-period-30d").getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByTestId("chart-period-7d").getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("CX-U-21: 期間ボタン click → onPeriodChange が選択 period で呼ばれる", () => {
    const onChange = vi.fn();
    render(
      <DashboardCharts charts={[]} period="30d" onPeriodChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId("chart-period-7d"));
    expect(onChange).toHaveBeenCalledWith("7d");
    fireEvent.click(screen.getByTestId("chart-period-all"));
    expect(onChange).toHaveBeenCalledWith("all");
  });
});

describe("sharedXDomain (chart-ux)", () => {
  it("CX-U-30: 全 chart points の min/max を bucketEpoch で算出", () => {
    const charts: DashboardChart[] = [
      mkChart("mau", "ユーザー数", "count", [
        ["a", [{ capturedAt: "2026-05-10T00:00:30Z", value: 1 }]],
      ]),
      mkChart("revenue_total_yen", "収益", "jpy", [
        ["a", [{ capturedAt: "2026-05-12T00:00:45Z", value: 2 }]],
      ]),
    ];
    expect(sharedXDomain(charts)).toEqual([
      bucketEpoch("2026-05-10T00:00:30Z"),
      bucketEpoch("2026-05-12T00:00:45Z"),
    ]);
  });

  it("CX-U-31: 点ゼロ → undefined", () => {
    expect(sharedXDomain([mkChart("mau", "ユーザー数", "count", [])])).toBe(
      undefined,
    );
  });
});
