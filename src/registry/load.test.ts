import { describe, it, expect } from "vitest";
import { validateServicesToml } from "./load.js";

const ok = `
[[service]]
slug = "hana-memo"
name = "hana-memo"
url = "https://hana-memo.example.com"
status = "active"
[service.providers.vercel]
projectId = "prj_x"
[service.providers.clerk]
appId = "app_x"
secretEnv = "HANAMEMO_CLERK_SECRET"

[[service]]
slug = "sanpo-log"
name = "sanpo-log"
url = "https://sanpo.example.com"
status = "paused"
`;

describe("validateServicesToml", () => {
  it("RG-N1: 正常 TOML → 2 service / errors 空", () => {
    const r = validateServicesToml(ok);
    expect(r.services).toHaveLength(2);
    expect(r.errors).toEqual([]);
    expect(r.services[0].providers.vercel?.projectId).toBe("prj_x");
  });

  it("RG-N3/B2: providers なし service も OK (ping のみ対象)", () => {
    const r = validateServicesToml(`[[service]]\nslug="x"\nname="x"\nurl="https://x.example.com"\n`);
    expect(r.services).toHaveLength(1);
    expect(r.services[0].status).toBe("active"); // default
  });

  it("RG-E1: slug 重複 → 後者除外 + error", () => {
    const dup = `[[service]]\nslug="a"\nname="a"\nurl="https://a.example.com"\n[[service]]\nslug="a"\nname="a2"\nurl="https://a2.example.com"\n`;
    const r = validateServicesToml(dup);
    expect(r.services).toHaveLength(1);
    expect(r.errors.some((e) => /重複/.test(e.message))).toBe(true);
  });

  it("RG-E2: 不正 slug → error", () => {
    const r = validateServicesToml(`[[service]]\nslug="Hana Memo"\nname="x"\nurl="https://x.example.com"\n`);
    expect(r.services).toHaveLength(0);
    expect(r.errors[0].message).toMatch(/slug/);
  });

  it("RG-E3: 内部 URL → error (SSRF)", () => {
    const r = validateServicesToml(`[[service]]\nslug="x"\nname="x"\nurl="http://127.0.0.1:3000"\n`);
    expect(r.services).toHaveLength(0);
    expect(r.errors[0].message).toMatch(/内部アドレス|SSRF/);
  });

  it("RG-E4: secretEnv に秘密直書き → error (O25)", () => {
    const r = validateServicesToml(`[[service]]\nslug="x"\nname="x"\nurl="https://x.example.com"\n[service.providers.clerk]\nappId="a"\nsecretEnv="sk_live_abc123"\n`);
    expect(r.services).toHaveLength(0);
    expect(r.errors[0].message).toMatch(/env キー名|直書き/);
  });

  it("RG-E5: 壊れた TOML → throw", () => {
    expect(() => validateServicesToml(`[[service]\nslug=`)).toThrow(/TOML/);
  });

  it("RG-B1: 空 → 空配列", () => {
    expect(validateServicesToml(``)).toEqual({ services: [], errors: [] });
  });
});
