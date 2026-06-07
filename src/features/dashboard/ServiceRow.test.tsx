import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServiceRow } from "./ServiceRow.js";
import type { ServiceRowVM } from "./summary.js";

// ServiceRow は <tr> を返すため table/tbody でラップして render する。
const renderRow = (over: Partial<ServiceRowVM> = {}) => {
  const row: ServiceRowVM = {
    slug: "a",
    name: "Service A",
    url: "https://a.example/",
    status: "active",
    up: true,
    metrics: {},
    freeTierState: null,
    openAlertCount: 0,
    profitability: { revenue: null, cost: null, profit: null, state: null },
    funnel: { started: null, abandonmentRate: null, cardFailureRate: null },
    ...over,
  };
  return render(
    <table>
      <tbody>
        <ServiceRow row={row} />
      </tbody>
    </table>,
  );
};

// last-deploy-col: 最終デプロイ日時カラム
describe("ServiceRow 最終デプロイカラム (last-deploy-col)", () => {
  it("LDC-U-02: last_deploy_at あり → JST 日時を表示", () => {
    // UTC 2026-05-29 00:00 → JST 2026-05-29 09:00
    const epoch = Date.UTC(2026, 4, 29, 0, 0, 0);
    renderRow({
      metrics: { last_deploy_at: { value: epoch, unit: "epoch_ms" } },
    });
    const cell = document.querySelector("[data-deploy-at]");
    expect(cell).not.toBeNull();
    expect(cell!.textContent).toBe("2026-05-29 09:00");
  });

  it("LDC-U-12: last_deploy_at 未収集 → —", () => {
    renderRow({ metrics: {} });
    const cell = document.querySelector("[data-deploy-at]");
    expect(cell).not.toBeNull();
    expect(cell!.textContent).toBe("—");
  });

  it("LDC-U-13b: last_deploy_at = 0 (adapters 欠落値) → —", () => {
    renderRow({ metrics: { last_deploy_at: { value: 0, unit: "epoch_ms" } } });
    const cell = document.querySelector("[data-deploy-at]");
    expect(cell!.textContent).toBe("—");
  });

  it("リグレッション: 既存セル (slug / alerts) は従来通り表示", () => {
    renderRow({ slug: "svc-x", openAlertCount: 2 });
    expect(screen.getAllByText("svc-x").length).toBeGreaterThan(0);
    expect(screen.getByText("2")).not.toBeNull();
  });
});

// revenue-metrics-display (C20260607-001): 収益カラム
describe("ServiceRow 収益カラム (revenue-metrics-display)", () => {
  it("REV-U-01: revenue_total_yen あり → ¥表記", () => {
    renderRow({ metrics: { revenue_total_yen: { value: 100, unit: "jpy" } } });
    const cell = document.querySelector("[data-revenue-yen]");
    expect(cell).not.toBeNull();
    expect(cell!.textContent).toBe("¥100");
  });

  it("REV-U-02: revenue_count あり → 件数を表示", () => {
    renderRow({ metrics: { revenue_count: { value: 1, unit: "count" } } });
    const cell = document.querySelector("[data-revenue-count]");
    expect(cell).not.toBeNull();
    expect(cell!.textContent).toBe("1");
  });

  it("REV-U-03: revenue_count / revenue_total_yen 両方申告", () => {
    renderRow({
      metrics: {
        revenue_count: { value: 1, unit: "count" },
        revenue_total_yen: { value: 100, unit: "jpy" },
      },
    });
    expect(document.querySelector("[data-revenue-count]")!.textContent).toBe(
      "1",
    );
    expect(document.querySelector("[data-revenue-yen]")!.textContent).toBe(
      "¥100",
    );
  });

  it("REV-U-10: 収益 未申告 → 両セル —", () => {
    renderRow({ metrics: {} });
    expect(document.querySelector("[data-revenue-count]")!.textContent).toBe(
      "—",
    );
    expect(document.querySelector("[data-revenue-yen]")!.textContent).toBe("—");
  });

  it("REV-U-20: 申告ありで値 0 → ¥0 / 0 (未申告 — と区別、0 は有効値)", () => {
    renderRow({
      metrics: {
        revenue_count: { value: 0, unit: "count" },
        revenue_total_yen: { value: 0, unit: "jpy" },
      },
    });
    expect(document.querySelector("[data-revenue-count]")!.textContent).toBe(
      "0",
    );
    expect(document.querySelector("[data-revenue-yen]")!.textContent).toBe(
      "¥0",
    );
  });
});
