import { describe, it, expect } from "vitest";
import { isProviderKind, isServiceStatus, isCollectionStatus } from "./guards.js";
import { PROVIDER_KINDS, MVP_PROVIDERS } from "./provider.js";

describe("isProviderKind", () => {
  it("true for all valid kinds (T-N1)", () => {
    for (const k of ["ping", "vercel", "neon", "clerk", "cloudflare", "sentry"]) {
      expect(isProviderKind(k)).toBe(true);
    }
  });
  it("false for invalid / casing / empty (T-E1)", () => {
    for (const k of ["aws", "", "Vercel", "PING"]) expect(isProviderKind(k)).toBe(false);
  });
  it("false for non-string (T-B1)", () => {
    for (const k of [undefined, null, 123, {}, []]) expect(isProviderKind(k)).toBe(false);
  });
});

describe("isServiceStatus", () => {
  it("true for active/paused/retired (T-N2)", () => {
    for (const s of ["active", "paused", "retired"]) expect(isServiceStatus(s)).toBe(true);
  });
  it("false for invalid (T-E2)", () => {
    for (const s of ["deleted", null, 123, "Active"]) expect(isServiceStatus(s)).toBe(false);
  });
});

describe("isCollectionStatus", () => {
  it("true for ok/partial/failed (T-N3)", () => {
    for (const s of ["ok", "partial", "failed"]) expect(isCollectionStatus(s)).toBe(true);
  });
  it("false for invalid", () => {
    for (const s of ["done", "OK", null]) expect(isCollectionStatus(s)).toBe(false);
  });
});

describe("constant arrays", () => {
  it("PROVIDER_KINDS has 6 unique kinds (T-N4)", () => {
    expect(PROVIDER_KINDS).toHaveLength(6);
    expect(new Set(PROVIDER_KINDS).size).toBe(6);
  });
  it("MVP_PROVIDERS excludes sentry/cloudflare (T-N5)", () => {
    expect([...MVP_PROVIDERS]).toEqual(["ping", "vercel", "neon", "clerk"]);
    expect(MVP_PROVIDERS).not.toContain("sentry");
    expect(MVP_PROVIDERS).not.toContain("cloudflare");
  });
});
