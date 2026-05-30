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
