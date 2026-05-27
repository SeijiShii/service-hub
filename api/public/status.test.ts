import { describe, it, expect, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";

// DB / registry をモック (公開 200 経路を無認証で検証)
vi.mock("../../src/db/index.js", () => ({
  createDb: () => ({}),
  latestPerService: async () => [
    { id: "1", serviceSlug: "a", provider: "ping", metricKey: "up", metricValue: 1, unit: "bool", capturedAt: "2026-05-27T00:00:00.000Z" },
    { id: "2", serviceSlug: "a", provider: "service-info", metricKey: "revenue_month_usd", metricValue: 9999, unit: "usd", capturedAt: "2026-05-27T00:00:00.000Z" },
  ],
}));
vi.mock("../../src/registry/index.js", () => ({
  loadServices: () => [{ slug: "a", name: "A", url: "https://a.example.com", status: "active", providers: {} }],
}));

import handler from "./status.js";

function mockRes() {
  const out: { code?: number; body?: unknown; headers: Record<string, string>; ended?: boolean } = { headers: {} };
  const res = {
    status(c: number) { out.code = c; return res; },
    json(b: unknown) { out.body = b; return res; },
    setHeader(k: string, v: string) { out.headers[k] = v; return res; },
    end() { out.ended = true; return res; },
  } as VercelResponse;
  return { res, out };
}

describe("GET /api/public/status (public-status-api Phase 2)", () => {
  it("PS-H1: 無認証 GET → 200 + PublicServiceStatus[]", async () => {
    const { res, out } = mockRes();
    await handler({ method: "GET", query: {}, headers: {} } as VercelRequest, res);
    expect(out.code).toBe(200);
    expect(out.body).toEqual([
      { slug: "a", name: "A", url: "https://a.example.com", status: "up", lastCheckedAt: "2026-05-27T00:00:00.000Z" },
    ]);
  });
  it("PS-H2 (セキュリティ): レスポンスに内部指標キーが含まれない", async () => {
    const { res, out } = mockRes();
    await handler({ method: "GET", query: {}, headers: {} } as VercelRequest, res);
    const json = JSON.stringify(out.body);
    for (const leak of ["revenue", "9999", "ai_cost", "mau", "raw_json"]) expect(json).not.toContain(leak);
  });
  it("PS-H3: OPTIONS → 204 + CORS", async () => {
    const { res, out } = mockRes();
    await handler({ method: "OPTIONS", query: {}, headers: {} } as VercelRequest, res);
    expect(out.code).toBe(204);
    expect(out.ended).toBe(true);
    expect(out.headers["Access-Control-Allow-Origin"]).toBe("*");
  });
  it("PS-H4: GET にも CORS + Cache-Control ヘッダ", async () => {
    const { res, out } = mockRes();
    await handler({ method: "GET", query: {}, headers: {} } as VercelRequest, res);
    expect(out.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(out.headers["Cache-Control"]).toBe("public, max-age=60");
  });
  it("PS-H5: POST → 405", async () => {
    const { res, out } = mockRes();
    await handler({ method: "POST", query: {}, headers: {} } as VercelRequest, res);
    expect(out.code).toBe(405);
  });
});
