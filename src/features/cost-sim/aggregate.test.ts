import { describe, it, expect } from "vitest";
import { aggregateByAccount, type ServiceUsage } from "./aggregate.js";

describe("aggregateByAccount (business-observability Phase D)", () => {
  it("BO-AG1: 同一 provider の複数サービスを account 単位で合算", () => {
    const usages: ServiceUsage[] = [
      { slug: "a", provider: "vercel", account: "vercel", usage: { bandwidth_bytes: 40 }, revenueUsd: 3 },
      { slug: "b", provider: "vercel", account: "vercel", usage: { bandwidth_bytes: 50 }, revenueUsd: 2 },
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
      { slug: "a", provider: "vercel", account: "vercel", usage: { bandwidth_bytes: 40 }, revenueUsd: 3 },
      { slug: "a", provider: "neon", account: "neon", usage: { db_storage_bytes: 100 }, revenueUsd: 3 },
    ];
    const accts = aggregateByAccount(usages);
    expect(accts).toHaveLength(2);
  });
  it("BO-AG3: 明示 account でグルーピングを上書き", () => {
    const usages: ServiceUsage[] = [
      { slug: "a", provider: "vercel", account: "team-x", usage: { bandwidth_bytes: 40 }, revenueUsd: 3 },
      { slug: "b", provider: "vercel", account: "team-y", usage: { bandwidth_bytes: 50 }, revenueUsd: 2 },
    ];
    expect(aggregateByAccount(usages)).toHaveLength(2);
  });
});
