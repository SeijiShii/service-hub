import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardView } from "./DashboardView.js";
import type { DashboardVM } from "./summary.js";

const vm = (over: Partial<DashboardVM> = {}): DashboardVM => ({
  rows: [],
  upCount: 0,
  downCount: 0,
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
});
