import { describe, it, expect } from "vitest";
import {
  requireSeiji,
  isAllowedUser,
  isPublicCronPath,
  isPublicPath,
  AuthError,
} from "./guard.js";

const SEIJI = "user_seiji";

describe("requireSeiji", () => {
  it("AU-N1: seiji の認証済セッションは通過", () => {
    expect(requireSeiji({ userId: SEIJI }, SEIJI)).toEqual({ userId: SEIJI });
  });
  it("AU-E1: 未認証は 401", () => {
    expect(() => requireSeiji({ userId: null }, SEIJI)).toThrow(AuthError);
    try {
      requireSeiji(null, SEIJI);
    } catch (e) {
      expect((e as AuthError).status).toBe(401);
    }
  });
  it("AU-E2: 認証済・非 seiji は 403", () => {
    try {
      requireSeiji({ userId: "user_other" }, SEIJI);
    } catch (e) {
      expect((e as AuthError).status).toBe(403);
    }
  });
  it("AU-B1/E3: allowedId 未設定はフェイルクローズ (403)", () => {
    try {
      requireSeiji({ userId: SEIJI }, undefined);
    } catch (e) {
      expect((e as AuthError).status).toBe(403);
    }
  });
});

describe("isAllowedUser (AU-N2)", () => {
  it("一致で true", () => expect(isAllowedUser(SEIJI, SEIJI)).toBe(true));
  it("不一致 / 未設定で false", () => {
    expect(isAllowedUser("x", SEIJI)).toBe(false);
    expect(isAllowedUser(SEIJI, undefined)).toBe(false);
    expect(isAllowedUser(null, SEIJI)).toBe(false);
  });
});

describe("isPublicCronPath (AU-B2)", () => {
  it("cron パスはユーザーゲート対象外", () => {
    expect(isPublicCronPath("/api/cron/collect")).toBe(true);
    expect(isPublicCronPath("/api/dashboard/summary")).toBe(false);
  });
});

describe("isPublicPath (PS-G: 公開ルートの唯一の例外)", () => {
  it("PS-G1/G3: /api/public/* はユーザーゲート対象外", () => {
    expect(isPublicPath("/api/public/status")).toBe(true);
    expect(isPublicPath("/api/public/anything")).toBe(true);
  });
  it("PS-G2: それ以外は gate 対象 (公開でない)", () => {
    expect(isPublicPath("/api/dashboard/summary")).toBe(false);
    expect(isPublicPath("/api/cost-sim/summary")).toBe(false);
    expect(isPublicPath("/api/cron/collect")).toBe(false);
  });
});
