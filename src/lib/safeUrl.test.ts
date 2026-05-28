import { describe, it, expect } from "vitest";
import { isSafePublicUrl } from "./safeUrl.js";

describe("isSafePublicUrl (FP-U-34: SSRF 予防 SoT, spec-review R3)", () => {
  describe("正常系 (https + 公開ホスト)", () => {
    it("https://example.com/favicon.svg → true", () => {
      expect(isSafePublicUrl("https://example.com/favicon.svg")).toBe(true);
    });
    it("https://sub.example.com/path/to/icon.png → true", () => {
      expect(isSafePublicUrl("https://sub.example.com/path/to/icon.png")).toBe(true);
    });
    it("https://example.com:8443/favicon.ico (port 指定) → true", () => {
      expect(isSafePublicUrl("https://example.com:8443/favicon.ico")).toBe(true);
    });
  });

  describe("プロトコル拒否", () => {
    it("http://... → false (https 必須)", () => {
      expect(isSafePublicUrl("http://example.com/favicon.svg")).toBe(false);
    });
    it("javascript:alert(1) → false", () => {
      expect(isSafePublicUrl("javascript:alert(1)")).toBe(false);
    });
    it("data:image/png;base64,... → false", () => {
      expect(isSafePublicUrl("data:image/png;base64,iVBORw0KG")).toBe(false);
    });
    it("ftp://example.com/x → false", () => {
      expect(isSafePublicUrl("ftp://example.com/x")).toBe(false);
    });
  });

  describe("internal アドレス拒否 (SSRF 予防)", () => {
    it("https://localhost/x → false", () => {
      expect(isSafePublicUrl("https://localhost/x")).toBe(false);
    });
    it("https://127.0.0.1/x → false", () => {
      expect(isSafePublicUrl("https://127.0.0.1/x")).toBe(false);
    });
    it("https://10.0.0.5/x → false", () => {
      expect(isSafePublicUrl("https://10.0.0.5/x")).toBe(false);
    });
    it("https://192.168.1.1/x → false", () => {
      expect(isSafePublicUrl("https://192.168.1.1/x")).toBe(false);
    });
    it("https://169.254.169.254/x (link-local, AWS metadata) → false", () => {
      expect(isSafePublicUrl("https://169.254.169.254/x")).toBe(false);
    });
    it("https://172.16.0.1/x → false", () => {
      expect(isSafePublicUrl("https://172.16.0.1/x")).toBe(false);
    });
    it("https://172.31.255.255/x → false (172.16-31 範囲)", () => {
      expect(isSafePublicUrl("https://172.31.255.255/x")).toBe(false);
    });
    it("https://0.0.0.0/x → false", () => {
      expect(isSafePublicUrl("https://0.0.0.0/x")).toBe(false);
    });
  });

  describe("境界値 (length)", () => {
    it("1024 chars ちょうど → true (default maxLength=1024)", () => {
      const url = "https://example.com/" + "a".repeat(1024 - "https://example.com/".length);
      expect(url.length).toBe(1024);
      expect(isSafePublicUrl(url)).toBe(true);
    });
    it("1025 chars → false (1 char 超過)", () => {
      const url = "https://example.com/" + "a".repeat(1025 - "https://example.com/".length);
      expect(url.length).toBe(1025);
      expect(isSafePublicUrl(url)).toBe(false);
    });
    it("カスタム maxLength=512 で 513 chars → false", () => {
      const url = "https://example.com/" + "a".repeat(513 - "https://example.com/".length);
      expect(isSafePublicUrl(url, { maxLength: 512 })).toBe(false);
    });
  });

  describe("型・空・パース不能", () => {
    it("空文字 → false", () => {
      expect(isSafePublicUrl("")).toBe(false);
    });
    it("undefined → false", () => {
      expect(isSafePublicUrl(undefined)).toBe(false);
    });
    it("null → false", () => {
      expect(isSafePublicUrl(null)).toBe(false);
    });
    it("number → false", () => {
      expect(isSafePublicUrl(12345)).toBe(false);
    });
    it("object → false", () => {
      expect(isSafePublicUrl({ url: "https://example.com" })).toBe(false);
    });
    it("不正な URL 文字列 → false", () => {
      expect(isSafePublicUrl("not a url at all")).toBe(false);
    });
    it("https:// だけ → false (ホスト無し)", () => {
      expect(isSafePublicUrl("https://")).toBe(false);
    });
  });
});
