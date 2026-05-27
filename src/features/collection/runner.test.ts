import { describe, it, expect, vi } from "vitest";
import { runCollection, type RunnerDeps } from "./runner.js";
import { checkCronSecret } from "./cronSecret.js";
import type {
  ServiceDescriptor,
  ProviderAdapter,
  SnapshotRow,
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
