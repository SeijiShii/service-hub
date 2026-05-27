import { describe, it, expect } from "vitest";
import {
  aggregateByAccount,
  buildServiceUsages,
  type ServiceUsage,
} from "./aggregate.js";
import type { SnapshotRow } from "../../types/index.js";

const snap = (o: Partial<SnapshotRow>): SnapshotRow => ({
  id: "x",
  serviceSlug: "a",
  provider: "vercel",
  metricKey: "bandwidth_bytes",
  metricValue: 1,
  unit: "bytes",
  capturedAt: "t",
  ...o,
});

describe("aggregateByAccount (business-observability Phase D)", () => {
  it("BO-AG1: 同一 provider の複数サービスを account 単位で合算", () => {
    const usages: ServiceUsage[] = [
      {
        slug: "a",
        provider: "vercel",
        account: "vercel",
        usage: { bandwidth_bytes: 40 },
        revenueUsd: 3,
      },
      {
        slug: "b",
        provider: "vercel",
        account: "vercel",
        usage: { bandwidth_bytes: 50 },
        revenueUsd: 2,
      },
    ];
    const accts = aggregateByAccount(usages);
    expect(accts).toHaveLength(1);
    expect(accts[0]!.provider).toBe("vercel");
    expect(accts[0]!.serviceCount).toBe(2);
    expect(accts[0]!.usage.bandwidth_bytes).toBe(90);
    expect(accts[0]!.aggregateRevenueUsd).toBe(5);
  });
  it("BO-AG2: provider/account が違えば別グループ", () => {
    const usages: ServiceUsage[] = [
      {
        slug: "a",
        provider: "vercel",
        account: "vercel",
        usage: { bandwidth_bytes: 40 },
        revenueUsd: 3,
      },
      {
        slug: "a",
        provider: "neon",
        account: "neon",
        usage: { db_storage_bytes: 100 },
        revenueUsd: 3,
      },
    ];
    const accts = aggregateByAccount(usages);
    expect(accts).toHaveLength(2);
  });
  it("BO-AG3: 明示 account でグルーピングを上書き", () => {
    const usages: ServiceUsage[] = [
      {
        slug: "a",
        provider: "vercel",
        account: "team-x",
        usage: { bandwidth_bytes: 40 },
        revenueUsd: 3,
      },
      {
        slug: "b",
        provider: "vercel",
        account: "team-y",
        usage: { bandwidth_bytes: 50 },
        revenueUsd: 2,
      },
    ];
    expect(aggregateByAccount(usages)).toHaveLength(2);
  });

  it("BO-AG4: buildServiceUsages — 収益付与 + service-info/ping を account 化しない", () => {
    const rows: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        provider: "vercel",
        metricKey: "bandwidth_bytes",
        metricValue: 40,
      }),
      snap({
        serviceSlug: "a",
        provider: "neon",
        metricKey: "db_storage_bytes",
        metricValue: 100,
      }),
      snap({
        serviceSlug: "a",
        provider: "service-info",
        metricKey: "revenue_month_usd",
        metricValue: 12,
      }),
      snap({
        serviceSlug: "a",
        provider: "ping",
        metricKey: "up",
        metricValue: 1,
      }),
    ];
    const usages = buildServiceUsages(rows);
    // vercel + neon の 2 つ (service-info/ping は除外)
    expect(usages.map((u) => u.provider).sort()).toEqual(["neon", "vercel"]);
    // 収益は両 provider に付与 (各 account の格上げ判断で参照)
    expect(usages.every((u) => u.revenueUsd === 12)).toBe(true);
    expect(
      usages.find((u) => u.provider === "vercel")!.usage.bandwidth_bytes,
    ).toBe(40);
  });
});
