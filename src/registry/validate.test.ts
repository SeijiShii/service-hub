import { describe, it, expect } from "vitest";
import { validateServiceInput } from "./validate.js";

const base = {
  slug: "demo-svc",
  name: "Demo",
  url: "https://demo.example.com",
  status: "active",
  providers: { vercel: { projectId: "prj_1" } },
};

describe("validateServiceInput (admin write 検証)", () => {
  it("U-07: 妥当な入力 → ok", () => {
    const r = validateServiceInput(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.slug).toBe("demo-svc");
  });

  it("U-10: url が内部アドレス → 拒否 (SSRF)", () => {
    const r = validateServiceInput({ ...base, url: "http://127.0.0.1:3000" });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.errors.map((e) => e.message).join(";")).toMatch(
        /SSRF|内部アドレス/,
      );
  });

  it("U-10b: url が localhost → 拒否", () => {
    expect(
      validateServiceInput({ ...base, url: "http://localhost:3000" }).ok,
    ).toBe(false);
  });

  it("U-11: serviceInfo.endpoint が内部アドレス → 拒否", () => {
    const r = validateServiceInput({
      ...base,
      serviceInfo: { endpoint: "http://10.0.0.5/api/hub/service-info" },
    });
    expect(r.ok).toBe(false);
  });

  it("U-12: provider 識別子に秘密直書き → 拒否", () => {
    const r = validateServiceInput({
      ...base,
      providers: { vercel: { projectId: "sk_live_abc123" } },
    });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.errors.map((e) => e.message).join(";")).toMatch(/秘密|識別子/);
  });

  it("U-13: 不正な slug → 拒否", () => {
    expect(validateServiceInput({ ...base, slug: "Demo Svc!" }).ok).toBe(false);
    expect(validateServiceInput({ ...base, slug: "" }).ok).toBe(false);
  });

  it("U-13b: 必須欠落 (url なし) → 拒否", () => {
    const { url, ...noUrl } = base;
    expect(validateServiceInput(noUrl).ok).toBe(false);
  });
});
