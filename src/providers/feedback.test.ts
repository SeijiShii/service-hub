import { describe, it, expect, vi } from "vitest";
import { fetchFeedback, feedbackEndpoint } from "./feedback.js";
import type { ServiceDescriptor } from "../types/index.js";

const SVC: ServiceDescriptor = {
  slug: "hana-memo",
  name: "hana-memo",
  url: "https://hana-memo.example.com",
  status: "active",
  providers: {},
  serviceInfo: { endpoint: "https://hana-memo.example.com/api/hub/service-info" },
};

function mockFetch(status: number, body: unknown): typeof fetch {
  return (async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  })) as unknown as typeof fetch;
}

const deps = (f: typeof fetch) => ({
  fetchImpl: f,
  allowInternal: true,
  env: { HUB_SERVICE_INFO_SECRET: "s3cret" },
  now: () => new Date("2026-06-18T00:00:00.000Z"),
});

function resp(items: unknown[], over: Record<string, unknown> = {}) {
  return { schemaVersion: 1, service: "hana-memo", items, ...over };
}

describe("fetchFeedback (feedback-inbox pull adapter, R2/R4)", () => {
  it("R2: endpoint は origin + 固定パスで派生", () => {
    expect(feedbackEndpoint(SVC)).toBe(
      "https://hana-memo.example.com/api/hub/feedback",
    );
    // serviceInfo.endpoint 不在でも s.url origin から派生
    expect(feedbackEndpoint({ ...SVC, serviceInfo: undefined })).toBe(
      "https://hana-memo.example.com/api/hub/feedback",
    );
  });

  it("U-08: 正常レスポンスを FeedbackItemRow[] に", async () => {
    const f = mockFetch(
      200,
      resp([
        { id: "a", kind: "feedback", body: "good", createdAt: "2026-06-10T00:00:00Z" },
        { id: "b", kind: "bug", body: "crash", rating: 1, createdAt: "2026-06-11T00:00:00Z", status: "open" },
      ]),
    );
    const r = await fetchFeedback(SVC, deps(f));
    expect(r.error).toBeUndefined();
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({
      serviceSlug: "hana-memo",
      externalId: "a",
      kind: "feedback",
      body: "good",
      pulledAt: "2026-06-18T00:00:00.000Z",
    });
    expect(r.items[1].rating).toBe(1);
    expect(r.items[1].status).toBe("open");
  });

  it("U-20: 404 (producer 未実装) は空 + feedback:404", async () => {
    const r = await fetchFeedback(SVC, deps(mockFetch(404, {})));
    expect(r.items).toEqual([]);
    expect(r.error).toBe("feedback:404");
  });

  it("U-22: 401 は空 + feedback:401", async () => {
    const r = await fetchFeedback(SVC, deps(mockFetch(401, {})));
    expect(r.error).toBe("feedback:401");
  });

  it("U-21: timeout は feedback:timeout", async () => {
    const f = (async () => {
      throw new Error("The operation was aborted (timeout)");
    }) as unknown as typeof fetch;
    const r = await fetchFeedback(SVC, deps(f));
    expect(r.error).toBe("feedback:timeout");
  });

  it("U-23: 不正スキーマ (items 非配列) は badschema", async () => {
    const r = await fetchFeedback(
      SVC,
      deps(mockFetch(200, { schemaVersion: 1, items: "nope" })),
    );
    expect(r.items).toEqual([]);
    expect(r.error).toBe("feedback:badschema");
  });

  it("U-24: 未知 kind の item は skip、他は通す", async () => {
    const f = mockFetch(
      200,
      resp([
        { id: "a", kind: "weird", body: "x", createdAt: "2026-06-10T00:00:00Z" },
        { id: "b", kind: "inquiry", body: "y", createdAt: "2026-06-10T00:00:00Z" },
      ]),
    );
    const r = await fetchFeedback(SVC, deps(f));
    expect(r.items.map((i) => i.externalId)).toEqual(["b"]);
  });

  it("U-25: createdAt 不正 / id 欠落 / body 空 は skip", async () => {
    const f = mockFetch(
      200,
      resp([
        { id: "a", kind: "bug", body: "x", createdAt: "not-a-date" },
        { id: "", kind: "bug", body: "x", createdAt: "2026-06-10T00:00:00Z" },
        { id: "c", kind: "bug", body: "", createdAt: "2026-06-10T00:00:00Z" },
      ]),
    );
    const r = await fetchFeedback(SVC, deps(f));
    expect(r.items).toEqual([]);
  });

  it("U-30: body length cap", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const long = "x".repeat(5000);
    const r = await fetchFeedback(
      SVC,
      deps(mockFetch(200, resp([{ id: "a", kind: "feedback", body: long, createdAt: "2026-06-10T00:00:00Z" }]))),
    );
    expect(r.items[0].body).toHaveLength(4000);
    warn.mockRestore();
  });

  it("U-32: items 空配列は正常 (エラーなし)", async () => {
    const r = await fetchFeedback(SVC, deps(mockFetch(200, resp([]))));
    expect(r.items).toEqual([]);
    expect(r.error).toBeUndefined();
  });
});
