import { describe, it, expect } from "vitest";
import handler from "./summary.js";
import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";

/**
 * 認可チェーンの結合テスト (mock しない、実 getAuthFromRequest を通す)。
 * route-mock E2E が迂回していたギャップ ([fix_001]) の再発防止:
 * セッション cookie が無い / 不正なリクエストは DB に到達せず 401 を返す。
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

describe("GET /api/dashboard/summary 認可ゲート (結合)", () => {
  it("AS-H1: __session cookie 無しは 401 (DB に到達しない)", async () => {
    const { res, out } = mockRes();
    await handler({ method: "GET", query: {}, headers: {} } as VercelRequest, res);
    expect(out.code).toBe(401);
    expect(out.body).toEqual({ error: "unauthorized" });
  });

  it("AS-H2: 不正な __session は検証失敗で 401 (フェイルクローズ)", async () => {
    const { res, out } = mockRes();
    await handler(
      { method: "GET", query: {}, headers: { cookie: "__session=not-a-valid-jwt" } } as VercelRequest,
      res,
    );
    expect(out.code).toBe(401);
  });

  it("AS-H3 (セキュリティ): x-clerk-user-id ヘッダ偽装は通らない (401)", async () => {
    const { res, out } = mockRes();
    await handler(
      { method: "GET", query: {}, headers: { "x-clerk-user-id": "user_seiji" } } as VercelRequest,
      res,
    );
    expect(out.code).toBe(401);
  });
});
