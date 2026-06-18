import { describe, it, expect } from "vitest";
import handler from "./inbox.js";
import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";

/**
 * 認可ゲートの結合テスト ([論点-007]/O67、U-26)。実 getAuthFromRequest を通し、
 * セッション無し/偽装は DB に到達せず 401。dashboard/summary.test.ts と同方針。
 */
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

describe("GET /api/feedback/inbox 認可ゲート (結合)", () => {
  it("U-26: __session cookie 無しは 401 (DB 非到達)", async () => {
    const { res, out } = mockRes();
    await handler(
      { method: "GET", query: {}, headers: {} } as VercelRequest,
      res,
    );
    expect(out.code).toBe(401);
    expect(out.body).toEqual({ error: "unauthorized" });
  });

  it("不正 __session は検証失敗で 401", async () => {
    const { res, out } = mockRes();
    await handler(
      {
        method: "GET",
        query: {},
        headers: { cookie: "__session=not-a-jwt" },
      } as VercelRequest,
      res,
    );
    expect(out.code).toBe(401);
  });

  it("セキュリティ: x-clerk-user-id 偽装は通らない (401)", async () => {
    const { res, out } = mockRes();
    await handler(
      {
        method: "GET",
        query: {},
        headers: { "x-clerk-user-id": "user_seiji" },
      } as VercelRequest,
      res,
    );
    expect(out.code).toBe(401);
  });
});
