import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServiceDetailView } from "./ServiceDetailView.js";
import type { ServiceDetailVM } from "./detail.js";

const vm = (over: Partial<ServiceDetailVM> = {}): ServiceDetailVM => ({
  slug: "hana-memo",
  name: "hana-memo",
  url: "https://hana-memo.example.com",
  status: "active",
  series: [],
  alerts: [],
  funnel: { started: null, abandonmentRate: null, cardFailureRate: null },
  ...over,
});

describe("ServiceDetailView", () => {
  it("SD-N1: meta + チャート表示", () => {
    render(
      <ServiceDetailView
        vm={vm({
          series: [
            {
              metricKey: "db_storage_bytes",
              unit: "bytes",
              points: [
                { capturedAt: "t1", value: 1 },
                { capturedAt: "t2", value: 2 },
              ],
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("hana-memo")).toBeTruthy();
    const chart = screen.getByTestId("chart-db_storage_bytes");
    expect(chart.getAttribute("data-points")).toBe("2");
  });

  it("SD-E1: vm=null → 404", () => {
    render(<ServiceDetailView vm={null} />);
    expect(screen.getByTestId("not-found")).toBeTruthy();
  });

  it("BO-SD-N: 決済ファネル離脱率を表示 (全体 + カード失敗)", () => {
    render(
      <ServiceDetailView
        vm={vm({
          funnel: { started: 100, abandonmentRate: 0.3, cardFailureRate: 0.12 },
        })}
      />,
    );
    expect(document.querySelector("[data-funnel-abandon]")?.textContent).toBe(
      "30%",
    );
    expect(document.querySelector("[data-funnel-card]")?.textContent).toBe(
      "12%",
    );
  });

  it("BO-SD-E: ファネル未申告 → データなし", () => {
    render(<ServiceDetailView vm={vm()} />);
    expect(screen.getByTestId("funnel").textContent).toContain("データなし");
  });

  it("SD-E2: series 空 → EmptyState", () => {
    render(<ServiceDetailView vm={vm()} />);
    expect(screen.getByTestId("empty-state")).toBeTruthy();
  });

  it("アラート履歴表示", () => {
    render(
      <ServiceDetailView
        vm={vm({
          alerts: [
            {
              id: "1",
              serviceSlug: "hana-memo",
              provider: "ping",
              rule: "down",
              triggeredAt: "t",
              value: 0,
            },
          ],
        })}
      />,
    );
    expect(document.querySelector('li[data-rule="down"]')).toBeTruthy();
  });
});
