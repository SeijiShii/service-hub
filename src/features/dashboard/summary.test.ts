import { describe, it, expect } from "vitest";
import { buildDashboard } from "./summary.js";
import { rowStatusKind } from "./rowStatus.js";
import type { ServiceDescriptor, SnapshotRow, AlertEvent } from "../../types/index.js";

const svc = (slug: string, thresholds?: ServiceDescriptor["thresholds"]): ServiceDescriptor =>
  ({ slug, name: slug, url: `https://${slug}.example.com`, status: "active", providers: {}, thresholds });
const snap = (over: Partial<SnapshotRow>): SnapshotRow => ({
  id: "s", serviceSlug: "a", provider: "ping", metricKey: "up", metricValue: 1, unit: "bool",
  capturedAt: "2026-05-26T00:00:00.000Z", ...over,
});

describe("buildDashboard", () => {
  it("DA-N1/N4: 結合 + up/down カウント", () => {
    const vm = buildDashboard(
      [svc("a"), svc("b")],
      [snap({ serviceSlug: "a", metricValue: 1 }), snap({ serviceSlug: "b", metricValue: 0 }),
       snap({ serviceSlug: "a", metricKey: "mau", metricValue: 42, unit: "count" })],
      [],
    );
    expect(vm.upCount).toBe(1);
    expect(vm.downCount).toBe(1);
    expect(vm.rows.find((r) => r.slug === "a")?.metrics.mau?.value).toBe(42);
  });

  it("DA-N2: 無料枠 % → warn/over", () => {
    const s = svc("a", { db_storage_bytes: { warnPct: 80, limit: 1000 } });
    const warn = buildDashboard([s], [snap({ provider: "neon", metricKey: "db_storage_bytes", metricValue: 850, unit: "bytes" })], []);
    expect(warn.rows[0].freeTierState).toBe("warn");
    const over = buildDashboard([s], [snap({ provider: "neon", metricKey: "db_storage_bytes", metricValue: 1200, unit: "bytes" })], []);
    expect(over.rows[0].freeTierState).toBe("over");
  });

  it("DA-E3: メトリクス欠損 → up=null", () => {
    const vm = buildDashboard([svc("a")], [], []);
    expect(vm.rows[0].up).toBeNull();
  });

  it("openAlertCount 集計", () => {
    const a: AlertEvent = { id: "1", serviceSlug: "a", provider: "ping", rule: "down", triggeredAt: "x", value: 0 };
    const vm = buildDashboard([svc("a")], [], [a, { ...a, id: "2" }]);
    expect(vm.rows[0].openAlertCount).toBe(2);
  });

  it("DA-B1: 0 service → 空", () => {
    expect(buildDashboard([], [], []).rows).toEqual([]);
  });
});

describe("rowStatusKind", () => {
  const base = { slug: "a", name: "a", url: "u", status: "active" as const, metrics: {}, openAlertCount: 0 };
  it("down/over → down, warn → warn, up → up, null → unknown", () => {
    expect(rowStatusKind({ ...base, up: false, freeTierState: null })).toBe("down");
    expect(rowStatusKind({ ...base, up: true, freeTierState: "over" })).toBe("down");
    expect(rowStatusKind({ ...base, up: true, freeTierState: "warn" })).toBe("warn");
    expect(rowStatusKind({ ...base, up: true, freeTierState: "ok" })).toBe("up");
    expect(rowStatusKind({ ...base, up: null, freeTierState: null })).toBe("unknown");
  });
});
