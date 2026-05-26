import { describe, it, expect } from "vitest";
import { isInternalUrl, scrubSecrets, safeFetch } from "./fetch.js";

describe("isInternalUrl (PR-E5 SSRF)", () => {
  it("blocks internal addresses", () => {
    for (const u of ["http://127.0.0.1/x", "http://localhost:3000", "http://169.254.1.1", "http://10.0.0.5", "http://192.168.1.1", "not-a-url"])
      expect(isInternalUrl(u)).toBe(true);
  });
  it("allows public hosts", () => {
    for (const u of ["https://api.vercel.com/x", "https://hana-memo.example.com"])
      expect(isInternalUrl(u)).toBe(false);
  });
});

describe("scrubSecrets (PR-B1 / O25)", () => {
  it("redacts secret-like keys recursively", () => {
    const out = scrubSecrets({ token: "sk_live_x", nested: { authorization: "Bearer y", ok: 1 }, list: [{ secret: "z" }] }) as any;
    expect(out.token).toBe("[REDACTED]");
    expect(out.nested.authorization).toBe("[REDACTED]");
    expect(out.nested.ok).toBe(1);
    expect(out.list[0].secret).toBe("[REDACTED]");
  });
});

describe("safeFetch", () => {
  it("rejects internal address by default", async () => {
    await expect(safeFetch("http://127.0.0.1/x")).rejects.toThrow(/internal/);
  });
});
