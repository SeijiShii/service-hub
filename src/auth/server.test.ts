import { describe, it, expect } from "vitest";
import { getAuthFromRequest, readSessionToken, type VerifyFn } from "./server.js";

const ok: VerifyFn = async (t) => ({ sub: t === "good" ? "user_x" : undefined });
const boom: VerifyFn = async () => {
  throw new Error("expired/invalid");
};

describe("readSessionToken (AS-N2 / AS-B*)", () => {
  it("AS-N2: __session を cookie ヘッダから抽出", () => {
    expect(readSessionToken({ cookie: "foo=1; __session=good; bar=2" })).toBe("good");
  });
  it("AS-B1: cookie が配列/未設定でも null 安全", () => {
    expect(readSessionToken({})).toBeNull();
    expect(readSessionToken({ cookie: ["a=1"] as unknown as string })).toBeNull();
  });
  it("AS-B2: __session が空値なら null", () => {
    expect(readSessionToken({ cookie: "__session=; x=1" })).toBeNull();
  });
});

describe("getAuthFromRequest", () => {
  it("AS-N1: 有効な __session cookie を検証して userId を返す", async () => {
    expect(await getAuthFromRequest({ cookie: "__session=good" }, ok)).toEqual({ userId: "user_x" });
  });
  it("AS-E1: cookie 無しは null (→ requireSeiji 401)", async () => {
    expect(await getAuthFromRequest({}, ok)).toEqual({ userId: null });
  });
  it("AS-E2: 検証失敗 (期限切れ/改ざん) はフェイルクローズで null", async () => {
    expect(await getAuthFromRequest({ cookie: "__session=tampered" }, boom)).toEqual({ userId: null });
  });
  it("AS-S1 (セキュリティ): クライアント供給 x-clerk-user-id ヘッダは信頼しない", async () => {
    expect(await getAuthFromRequest({ "x-clerk-user-id": "user_seiji" }, ok)).toEqual({ userId: null });
  });
  it("AS-E3: sub を含まない payload は null", async () => {
    expect(await getAuthFromRequest({ cookie: "__session=nosub" }, ok)).toEqual({ userId: null });
  });
});
