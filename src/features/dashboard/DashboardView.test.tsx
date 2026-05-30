import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardView } from "./DashboardView.js";
import type { DashboardVM } from "./summary.js";
import type { CollectionRun } from "../../types/index.js";

const vm = (over: Partial<DashboardVM> = {}): DashboardVM => ({
  rows: [],
  upCount: 0,
  downCount: 0,
  lastUpdatedAt: null,
  lastRunStatus: null,
  // biz-charts: charts は required (常に 4 件: ユーザー数/課金額/コスト/採算、helper default は空 series)
  charts: [
    { metricKey: "mau", label: "ユーザー数", unit: "count", series: [] },
    {
      metricKey: "revenue_month_usd",
      label: "課金額",
      unit: "usd",
      series: [],
    },
    {
      metricKey: "ai_cost_month_usd",
      label: "コスト",
      unit: "usd",
      series: [],
    },
    { metricKey: "profit", label: "採算", unit: "usd", series: [] },
  ],
  ...over,
});

// business-observability: 未申告サービスの採算/ファネル既定 (データなし)
const bizNull = {
  profitability: { revenue: null, cost: null, profit: null, state: null },
  funnel: { started: null, abandonmentRate: null, cardFailureRate: null },
} as const;

describe("DashboardView", () => {
  it("UX-N1: ヘッダに /admin への 'admin-link' が表示される (O55 orphan 解消)", () => {
    render(<DashboardView vm={vm()} />);
    const link = screen.getByTestId("admin-link");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/admin");
    expect(link.textContent).toBe("管理");
  });

  it("DA-N4: ヘッダに up/down サマリ + 行表示", () => {
    render(
      <DashboardView
        vm={vm({
          rows: [
            {
              slug: "a",
              name: "a",
              url: "u",
              status: "active",
              up: true,
              metrics: { mau: { value: 142, unit: "count" } },
              freeTierState: "ok",
              openAlertCount: 0,
              ...bizNull,
            },
            {
              slug: "b",
              name: "b",
              url: "u",
              status: "active",
              up: false,
              metrics: {},
              freeTierState: null,
              openAlertCount: 1,
              ...bizNull,
            },
          ],
          upCount: 1,
          downCount: 1,
        })}
      />,
    );
    expect(screen.getByTestId("summary").textContent).toContain(
      "1 up · 1 down",
    );
    expect(screen.getByText("142")).toBeTruthy();
    // down 行は data-status=down
    expect(
      document.querySelector('tr[data-slug="b"]')?.getAttribute("data-status"),
    ).toBe("down");
    expect(
      document.querySelector('tr[data-slug="a"]')?.getAttribute("data-status"),
    ).toBe("up");
  });

  it("DA-E1: データなし → EmptyState", () => {
    render(<DashboardView vm={vm()} />);
    expect(screen.getByTestId("empty-state")).toBeTruthy();
  });

  it("DA-N4/E2: down あり or run failed → AlertBanner", () => {
    render(<DashboardView vm={vm({ rows: [], lastRunStatus: "failed" })} />);
    expect(screen.getByTestId("alert-banner")).toBeTruthy();
  });

  describe("最終更新表示 (refresh-cadence)", () => {
    beforeEach(() => {
      // 相対時間テストの決定的化: 現在時刻を 2026-05-28 03:10:00 UTC に固定
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-05-28T03:10:00.000Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("RC-N2: lastUpdatedAt が設定されている → 最終更新表示", () => {
      render(
        <DashboardView
          vm={vm({
            lastUpdatedAt: "2026-05-28T03:00:00.000Z",
            lastRunStatus: "ok",
          })}
        />,
      );
      const el = screen.getByTestId("last-updated");
      expect(el).toBeTruthy();
      // JST (UTC+9) 表記: 2026-05-28 12:00
      expect(el.textContent).toContain("2026-05-28");
      expect(el.textContent).toContain("12:00");
    });

    it("RC-N3: 7 分前の finishedAt → 相対時間 '10 分前' を表示 (固定時刻 03:10 vs 03:00)", () => {
      render(
        <DashboardView
          vm={vm({
            lastUpdatedAt: "2026-05-28T03:00:00.000Z",
            lastRunStatus: "ok",
          })}
        />,
      );
      const el = screen.getByTestId("last-updated");
      expect(el.textContent).toContain("10 分前");
    });

    it("RC-E1: lastUpdatedAt=null → 未収集 表示", () => {
      render(<DashboardView vm={vm()} />);
      const el = screen.getByTestId("last-updated");
      expect(el.textContent).toContain("未収集");
    });

    it("RC-E2: lastRunStatus=failed → 警告色 + status 表示", () => {
      render(
        <DashboardView
          vm={vm({
            lastUpdatedAt: "2026-05-28T03:00:00.000Z",
            lastRunStatus: "failed",
          })}
        />,
      );
      const el = screen.getByTestId("last-updated");
      expect(el.getAttribute("data-status")).toBe("failed");
      expect(el.textContent).toContain("failed");
    });
  });

  describe("force-pull section (nav-and-pull revise)", () => {
    it("TFP-B2: onForcePull 未渡し → force-pull section 非表示", () => {
      render(<DashboardView vm={vm()} />);
      expect(
        screen.queryByRole("button", { name: /今すぐ pull|実行中/ }),
      ).toBeNull();
    });

    it("TFP-N3: 「今すぐ pull」ボタン click → onForcePull が 1 回呼ばれる", () => {
      const onForcePull = vi.fn();
      render(<DashboardView vm={vm()} onForcePull={onForcePull} />);
      fireEvent.click(screen.getByRole("button", { name: "今すぐ pull" }));
      expect(onForcePull).toHaveBeenCalledTimes(1);
    });

    it("TFP-N4: forcePullState.lastResult → サマリ表示 (services/errors 件数)", () => {
      const result: CollectionRun = {
        id: "r1",
        startedAt: "2026-05-28T03:00:00.000Z",
        finishedAt: "2026-05-28T03:00:30.000Z",
        status: "ok",
        servicesCount: 3,
        errors: [{ serviceSlug: "x", provider: "ping", message: "timeout" }],
      };
      render(
        <DashboardView
          vm={vm()}
          onForcePull={() => {}}
          forcePullState={{ running: false, lastResult: result }}
        />,
      );
      const summary = screen.getByTestId("force-pull-result");
      expect(summary.textContent).toContain("3");
      expect(summary.textContent).toContain("1");
    });

    it("TFP-E4: running=true → ボタン disabled + 「実行中…」+ click 抑止", () => {
      const onForcePull = vi.fn();
      render(
        <DashboardView
          vm={vm()}
          onForcePull={onForcePull}
          forcePullState={{ running: true }}
        />,
      );
      const btn = screen.getByRole("button", {
        name: "実行中…",
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      fireEvent.click(btn);
      expect(onForcePull).not.toHaveBeenCalled();
    });
  });

  // ── timeseries-topchart (revise_timeseries-topchart_20260528) ──
  describe("dashboard 二部構成: 上部 chart + 下部 table (spec-review R4)", () => {
    it("TS-U-40: vm={rows: [], charts: [3 件]} → DashboardCharts section + empty-state 両表示", () => {
      render(<DashboardView vm={vm()} />);
      // 上部 chart section が render される
      expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
      // 下部 = rows 空時の既存「empty-state」表示維持 (リグレッション)
      expect(screen.getByTestId("empty-state")).not.toBeNull();
    });

    it("TS-U-41: vm={rows: [1 件], charts: [3 件]} → 上部 chart + 下部 table 両表示", () => {
      const rowVM = {
        slug: "a",
        name: "Service A",
        url: "https://a.example/",
        status: "active" as const,
        up: true,
        metrics: {},
        freeTierState: null,
        openAlertCount: 0,
        ...bizNull,
      };
      render(<DashboardView vm={vm({ rows: [rowVM], upCount: 1 })} />);
      expect(screen.getByTestId("dashboard-charts")).not.toBeNull();
      // 下部 table が render される (empty-state 非表示)
      expect(screen.queryByTestId("empty-state")).toBeNull();
      // table 内に slug が表示される (リグレッション)
      expect(screen.getAllByText("a").length).toBeGreaterThan(0);
    });
  });

  // ── last-deploy-col (revise_last-deploy-col_20260530) ──
  describe("一覧に最終デプロイ日時カラム追加 (last-deploy-col)", () => {
    it("LDC-U-03: thead に「最終デプロイ」列見出しが追加される", () => {
      const rowVM = {
        slug: "a",
        name: "Service A",
        url: "https://a.example/",
        status: "active" as const,
        up: true,
        metrics: {},
        freeTierState: null,
        openAlertCount: 0,
        ...bizNull,
      };
      render(<DashboardView vm={vm({ rows: [rowVM], upCount: 1 })} />);
      const headers = Array.from(document.querySelectorAll("thead th")).map(
        (th) => th.textContent,
      );
      expect(headers).toContain("最終デプロイ");
    });
  });
});
