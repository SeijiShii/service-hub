import { describe, it, expect, vi } from "vitest";
import { evaluate, type AlertDeps } from "./evaluate.js";
import { notify, type NotifyDeps } from "./notify.js";
import type { AlertEvent, ServiceDescriptor, SnapshotRow } from "../../types/index.js";

const svc = (slug: string, thresholds?: ServiceDescriptor["thresholds"]): ServiceDescriptor =>
  ({ slug, name: slug, url: `https://${slug}.example.com`, status: "active", providers: {}, thresholds });

const snap = (over: Partial<SnapshotRow>): SnapshotRow => ({
  id: "s", serviceSlug: "a", provider: "ping", metricKey: "up",
  metricValue: 1, unit: "bool", capturedAt: "2026-05-26T00:00:00.000Z", ...over,
});

const deps = (open: AlertEvent[], over: Partial<AlertDeps> = {}): AlertDeps & {
  recordAlert: ReturnType<typeof vi.fn>; resolveAlert: ReturnType<typeof vi.fn>;
} => ({
  getOpenAlerts: async () => open,
  recordAlert: vi.fn(async (_e: AlertEvent) => {}),
  resolveAlert: vi.fn(async (_id: string) => {}),
  now: () => new Date("2026-05-26T00:00:00.000Z"),
  newId: (() => { let n = 0; return () => `al-${n++}`; })(),
  ...over,
}) as any;

describe("evaluate", () => {
  it("AL-N1: ping up=0 → down 発火", async () => {
    const d = deps([]);
    const fired = await evaluate(d, [snap({ metricValue: 0 })], [svc("a")]);
    expect(fired).toHaveLength(1);
    expect(fired[0].rule).toBe("down");
    expect(d.recordAlert).toHaveBeenCalledOnce();
  });

  it("AL-N3: 使用量 ≥ limit → free_tier_over", async () => {
    const d = deps([]);
    const s = svc("a", { db_storage_bytes: { warnPct: 80, limit: 1000 } });
    const fired = await evaluate(d, [snap({ provider: "neon", metricKey: "db_storage_bytes", metricValue: 1000, unit: "bytes" })], [s]);
    expect(fired[0].rule).toBe("free_tier_over");
  });

  it("AL-N2/B2: 80% 境界 → free_tier_80pct", async () => {
    const d = deps([]);
    const s = svc("a", { db_storage_bytes: { warnPct: 80, limit: 1000 } });
    const fired = await evaluate(d, [snap({ provider: "neon", metricKey: "db_storage_bytes", metricValue: 800, unit: "bytes" })], [s]);
    expect(fired[0].rule).toBe("free_tier_80pct");
  });

  it("AL-E1: 同一 rule の open あり → 再発火しない", async () => {
    const existing: AlertEvent = { id: "x", serviceSlug: "a", provider: "ping", rule: "down", triggeredAt: "2026-05-25T00:00:00.000Z", value: 0 };
    const d = deps([existing]);
    const fired = await evaluate(d, [snap({ metricValue: 0 })], [svc("a")]);
    expect(fired).toHaveLength(0);
    expect(d.recordAlert).not.toHaveBeenCalled();
  });

  it("AL-E2: 前ラン down → 今ラン up → resolve", async () => {
    const existing: AlertEvent = { id: "x", serviceSlug: "a", provider: "ping", rule: "down", triggeredAt: "2026-05-25T00:00:00.000Z", value: 0 };
    const d = deps([existing]);
    await evaluate(d, [snap({ metricValue: 1 })], [svc("a")]); // up=1 → down 条件解消
    expect(d.resolveAlert).toHaveBeenCalledWith("x");
  });

  it("AL-B1: thresholds 未設定 → down のみ、使用量系スキップ", async () => {
    const d = deps([]);
    const fired = await evaluate(d, [snap({ provider: "neon", metricKey: "db_storage_bytes", metricValue: 9999, unit: "bytes" })], [svc("a")]);
    expect(fired).toHaveLength(0);
  });
});

describe("notify", () => {
  it("AL-N4: 未通知を送信 + markNotified", async () => {
    const channel = vi.fn(async (_e: AlertEvent) => {});
    const markNotified = vi.fn(async (_id: string) => {});
    const ev: AlertEvent = { id: "e1", serviceSlug: "a", provider: "ping", rule: "down", triggeredAt: "x", value: 0 };
    await notify({ channel, markNotified } as NotifyDeps, [ev]);
    expect(channel).toHaveBeenCalledOnce();
    expect(markNotified).toHaveBeenCalledWith("e1");
  });

  it("AL-E3: channel 送信失敗 → markNotified しない", async () => {
    const channel = vi.fn(async () => { throw new Error("down"); });
    const markNotified = vi.fn(async (_id: string) => {});
    const ev: AlertEvent = { id: "e1", serviceSlug: "a", provider: "ping", rule: "down", triggeredAt: "x", value: 0 };
    await expect(notify({ channel, markNotified } as NotifyDeps, [ev])).rejects.toThrow();
    expect(markNotified).not.toHaveBeenCalled();
  });

  it("既に notifiedAt あり → スキップ", async () => {
    const channel = vi.fn(async (_e: AlertEvent) => {});
    const markNotified = vi.fn(async (_id: string) => {});
    const ev: AlertEvent = { id: "e1", serviceSlug: "a", provider: "ping", rule: "down", triggeredAt: "x", value: 0, notifiedAt: "y" };
    await notify({ channel, markNotified } as NotifyDeps, [ev]);
    expect(channel).not.toHaveBeenCalled();
  });
});
