import { describe, it, expect } from "vitest";
import handler from "./summary.js";
import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";

/** 認可チェーンの結合テスト (mock しない)。fix_001 の回帰防止と整合。 */
function mockRes() {
  const out: { code?: number; body?: unknown } = {};
  const res = {
    status(c: number) {
      out.code = c;
      return res;
    },
    json(b: unknown) {
      out.body = b;
      return res;
    },
  } as VercelResponse;
  return { res, out };
}

describe("GET /api/cost-sim/summary 認可ゲート (結合)", () => {
  it("BO-CS-H1: __session cookie 無しは 401 (DB/pricing に到達しない)", async () => {
    const { res, out } = mockRes();
    await handler({ method: "GET", query: {}, headers: {} } as VercelRequest, res);
    expect(out.code).toBe(401);
  });
  it("BO-CS-H2: x-clerk-user-id ヘッダ偽装は通らない (401)", async () => {
    const { res, out } = mockRes();
    await handler(
      { method: "GET", query: {}, headers: { "x-clerk-user-id": "user_seiji" } } as VercelRequest,
      res,
    );
    expect(out.code).toBe(401);
  });
});
