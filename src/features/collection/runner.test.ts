import { describe, it, expect, vi } from "vitest";
import { runCollection, type RunnerDeps } from "./runner.js";
import { checkCronSecret } from "./cronSecret.js";
import type {
  ServiceDescriptor,
  ProviderAdapter,
  SnapshotRow,
  UsageMetric,
} from "../../types/index.js";

const svc = (
  slug: string,
  status: ServiceDescriptor["status"] = "active",
): ServiceDescriptor => ({
  slug,
  name: slug,
  url: `https://${slug}.example.com`,
  status,
  providers: {},
});

const okAdapter = (
  kind: ProviderAdapter["kind"],
  value = 1,
): ProviderAdapter => ({
  kind,
  collect: async () => ({
    metrics: [{ provider: kind, key: "up", value, unit: "bool" }],
  }),
});
const errAdapter = (
  kind: ProviderAdapter["kind"],
  error = "timeout",
): ProviderAdapter => ({ kind, collect: async () => ({ metrics: [], error }) });

const baseDeps = (over: Partial<RunnerDeps>): RunnerDeps => ({
  loadServices: async () => [svc("a")],
  getAdapters: () => [okAdapter("ping")],
  saveSnapshots: vi.fn(async () => {}),
  saveRun: vi.fn(async () => {}),
  now: () => new Date("2026-05-26T00:00:00.000Z"),
  newId: (() => {
    let n = 0;
    return () => `id-${n++}`;
  })(),
  ...over,
});

describe("runCollection", () => {
  it("CO-N1: 全成功 → status=ok + saveSnapshots 呼ばれる", async () => {
    const saveSnapshots = vi.fn(async (_rows: SnapshotRow[]) => {});
    const run = await runCollection(
      baseDeps({
        loadServices: async () => [svc("a"), svc("b")],
        getAdapters: () => [okAdapter("ping"), okAdapter("neon")],
        saveSnapshots,
      }),
    );
    expect(run.status).toBe("ok");
    expect(run.servicesCount).toBe(2);
    expect(saveSnapshots).toHaveBeenCalledOnce();
    expect(saveSnapshots.mock.calls[0][0].length).toBe(4); // 2 svc × 2 adapter
  });

  it("CO-E1: 一部 adapter error → partial + errors 集約", async () => {
    const run = await runCollection(
      baseDeps({
        getAdapters: () => [okAdapter("ping"), errAdapter("neon", "auth")],
      }),
    );
    expect(run.status).toBe("partial");
    expect(run.errors).toHaveLength(1);
    expect(run.errors?.[0]).toMatchObject({
      provider: "neon",
      message: "auth",
    });
  });

  it("CO-E2: 全 adapter error → failed", async () => {
    const run = await runCollection(
      baseDeps({ getAdapters: () => [errAdapter("ping")] }),
    );
    expect(run.status).toBe("failed");
  });

  it("CO-E3: db 保存失敗 → failed + run 記録", async () => {
    const saveRun = vi.fn(async () => {});
    const run = await runCollection(
      baseDeps({
        saveSnapshots: async () => {
          throw new Error("conn refused");
        },
        saveRun,
      }),
    );
    expect(run.status).toBe("failed");
    expect(saveRun).toHaveBeenCalledOnce();
  });

  it("CO-B1: 0 active → ok, servicesCount=0", async () => {
    const run = await runCollection(baseDeps({ loadServices: async () => [] }));
    expect(run.status).toBe("ok");
    expect(run.servicesCount).toBe(0);
  });

  it("onCollected hook (alerts 連携) が呼ばれる", async () => {
    const onCollected = vi.fn(async () => {});
    await runCollection(baseDeps({ onCollected }));
    expect(onCollected).toHaveBeenCalledOnce();
  });

  // ── fix C20260601-002: 1 run = 単一 capturedAt 不変条件 ──────
  it("FX-U-01: 可変クロック (呼ぶたびに進む now) でも 1 run の全 SnapshotRow が同一 capturedAt", async () => {
    // 固定 now でなく per-call で進むクロックを注入し、本番の per-row ドリフトを再現。
    let t = Date.parse("2026-06-01T00:00:00.000Z");
    const now = () => new Date((t += 1)); // 呼ぶたびに +1ms
    const saveSnapshots = vi.fn(async (_rows: SnapshotRow[]) => {});
    await runCollection(
      baseDeps({
        loadServices: async () => [svc("a"), svc("b")],
        getAdapters: () => [okAdapter("ping"), okAdapter("neon")],
        saveSnapshots,
        now,
      }),
    );
    const rows = saveSnapshots.mock.calls[0][0];
    expect(rows.length).toBe(4); // 2 svc × 2 adapter
    const uniqueCapturedAt = new Set(rows.map((r) => r.capturedAt));
    expect(uniqueCapturedAt.size).toBe(1); // run の論理時刻は 1 つ
  });

  // ── favicon-projection (revise_favicon-projection_20260528) ──────
  it("CO-RES-01: producer の unit 欠落は '' に矯正・非有限値は skip し batch を壊さない (C20260607-002)", async () => {
    const saveSnapshots = vi.fn(async (_rows: SnapshotRow[]) => {});
    const badAdapter: ProviderAdapter = {
      kind: "service-info",
      collect: async () => ({
        metrics: [
          // 契約違反: unit 欠落 (naze-bako の mau/users_total 等) → "" に矯正
          {
            provider: "service-info",
            key: "mau",
            value: 8,
          } as unknown as UsageMetric,
          {
            provider: "service-info",
            key: "revenue_total_yen",
            value: 100,
            unit: "jpy",
          },
          // 非有限値 → 当該 metric を skip (数値カラムを壊さない)
          {
            provider: "service-info",
            key: "broken",
            value: Number.NaN,
            unit: "count",
          },
        ],
      }),
    };
    const run = await runCollection(
      baseDeps({ getAdapters: () => [badAdapter], saveSnapshots }),
    );
    expect(run.status).toBe("ok");
    const rows = saveSnapshots.mock.calls[0][0];
    expect(rows.find((r) => r.metricKey === "mau")!.unit).toBe("");
    expect(rows.find((r) => r.metricKey === "revenue_total_yen")!.unit).toBe(
      "jpy",
    );
    expect(rows.find((r) => r.metricKey === "broken")).toBeUndefined();
  });

  it("FP-U-35: adapter が meta.iconUrl 返却 → deps.updateServiceMeta が (slug, meta) で呼ばれる", async () => {
    const updateServiceMeta = vi.fn(async () => {});
    const adapterWithMeta: ProviderAdapter = {
      kind: "service-info",
      collect: async () => ({
        metrics: [
          { provider: "service-info", key: "up", value: 1, unit: "bool" },
        ],
        meta: { iconUrl: "https://a.example/favicon.svg" },
      }),
    };
    await runCollection(
      baseDeps({
        loadServices: async () => [svc("a")],
        getAdapters: () => [adapterWithMeta],
        updateServiceMeta,
      }),
    );
    expect(updateServiceMeta).toHaveBeenCalledTimes(1);
    expect(updateServiceMeta).toHaveBeenCalledWith("a", {
      iconUrl: "https://a.example/favicon.svg",
    });
  });

  it("FP-U-36: adapter が meta 返却なし → deps.updateServiceMeta は呼ばれない (no-op 分岐)", async () => {
    const updateServiceMeta = vi.fn(async () => {});
    await runCollection(
      baseDeps({
        loadServices: async () => [svc("a")],
        getAdapters: () => [okAdapter("ping")], // meta 返さない
        updateServiceMeta,
      }),
    );
    expect(updateServiceMeta).not.toHaveBeenCalled();
  });

  it("FP-U-35b: updateServiceMeta hook 未渡し (optional) でも meta は無視で正常完了", async () => {
    const adapterWithMeta: ProviderAdapter = {
      kind: "service-info",
      collect: async () => ({
        metrics: [
          { provider: "service-info", key: "up", value: 1, unit: "bool" },
        ],
        meta: { iconUrl: "https://a.example/favicon.svg" },
      }),
    };
    const run = await runCollection(
      baseDeps({
        loadServices: async () => [svc("a")],
        getAdapters: () => [adapterWithMeta],
        // updateServiceMeta 未渡し
      }),
    );
    expect(run.status).toBe("ok");
  });

  it("FP-U-35c: updateServiceMeta が throw しても collect 全体は止まらない (warn 出力)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const updateServiceMeta = vi.fn(async () => {
      throw new Error("db_down");
    });
    const adapterWithMeta: ProviderAdapter = {
      kind: "service-info",
      collect: async () => ({
        metrics: [
          { provider: "service-info", key: "up", value: 1, unit: "bool" },
        ],
        meta: { iconUrl: "https://a.example/favicon.svg" },
      }),
    };
    const run = await runCollection(
      baseDeps({
        loadServices: async () => [svc("a")],
        getAdapters: () => [adapterWithMeta],
        updateServiceMeta,
      }),
    );
    expect(run.status).toBe("ok"); // collect 自体は ok (meta 失敗は warn 止まり)
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/updateServiceMeta failed: slug=a reason=db_down/),
    );
    warn.mockRestore();
  });
});

describe("checkCronSecret (CO-N3/E4)", () => {
  it("一致で true", () =>
    expect(checkCronSecret("Bearer s3cr3t", "s3cr3t")).toBe(true));
  it("不一致 / 未設定で false (フェイルクローズ)", () => {
    expect(checkCronSecret("Bearer wrong", "s3cr3t")).toBe(false);
    expect(checkCronSecret("Bearer s3cr3t", undefined)).toBe(false);
    expect(checkCronSecret(null, "s3cr3t")).toBe(false);
  });
});
