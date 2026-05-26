import { describe, it, expect } from "vitest";
import { buildServiceDetail } from "./detail.js";
import type {
  ServiceDescriptor,
  SnapshotRow,
  AlertEvent,
} from "../../types/index.js";

const svc = (slug: string): ServiceDescriptor => ({
  slug,
  name: slug,
  url: `https://${slug}.example.com`,
  status: "active",
  providers: {},
});
const snap = (over: Partial<SnapshotRow>): SnapshotRow => ({
  id: "s",
  serviceSlug: "a",
  provider: "neon",
  metricKey: "db_storage_bytes",
  metricValue: 100,
  unit: "bytes",
  capturedAt: "2026-05-26T00:00:00.000Z",
  ...over,
});

describe("buildServiceDetail", () => {
  it("SD-N1/N2: メトリクス別 series 構築", () => {
    const vm = buildServiceDetail(
      svc("a"),
      [
        snap({ capturedAt: "2026-05-25T00:00:00.000Z", metricValue: 100 }),
        snap({ capturedAt: "2026-05-26T00:00:00.000Z", metricValue: 200 }),
        snap({ metricKey: "mau", unit: "count", metricValue: 42 }),
      ],
      [],
    );
    expect(vm).not.toBeNull();
    expect(vm!.series).toHaveLength(2);
    const storage = vm!.series.find((s) => s.metricKey === "db_storage_bytes");
    expect(storage!.points.map((p) => p.value)).toEqual([100, 200]);
  });

  it("SD-E1: service なし → null (404)", () => {
    expect(buildServiceDetail(undefined, [], [])).toBeNull();
  });

  it("SD-E2/B1: snapshot なし → series 空", () => {
    expect(buildServiceDetail(svc("a"), [], [])!.series).toEqual([]);
  });

  it("当該 service の alert のみ", () => {
    const a: AlertEvent = {
      id: "1",
      serviceSlug: "a",
      provider: "ping",
      rule: "down",
      triggeredAt: "x",
      value: 0,
    };
    const vm = buildServiceDetail(
      svc("a"),
      [],
      [a, { ...a, id: "2", serviceSlug: "b" }],
    );
    expect(vm!.alerts).toHaveLength(1);
  });
});
