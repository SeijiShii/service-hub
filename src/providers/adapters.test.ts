import { describe, it, expect, vi } from "vitest";
import {
  createPingAdapter,
  createVercelAdapter,
  createNeonAdapter,
  createServiceInfoAdapter,
} from "./adapters.js";
import { getAdapters } from "./index.js";
import type { ServiceDescriptor } from "../types/index.js";

const svc = (over: Partial<ServiceDescriptor> = {}): ServiceDescriptor => ({
  slug: "svc",
  name: "svc",
  url: "https://svc.example.com",
  status: "active",
  providers: {},
  ...over,
});

// mock fetch ファクトリ
const mockFetch = (status: number, body: unknown): typeof fetch =>
  (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as any;
const throwFetch = (err: string): typeof fetch =>
  (async () => {
    throw new Error(err);
  }) as any;

describe("ping (PR-N1/N2)", () => {
  it("up=1 on 200", async () => {
    const r = await createPingAdapter({
      fetchImpl: mockFetch(200, {}),
      allowInternal: true,
    }).collect(svc());
    expect(r.metrics).toEqual([
      { provider: "ping", key: "up", value: 1, unit: "bool" },
    ]);
  });
  it("up=0 on 503", async () => {
    const r = await createPingAdapter({
      fetchImpl: mockFetch(503, {}),
      allowInternal: true,
    }).collect(svc());
    expect(r.metrics[0].value).toBe(0);
  });
});

describe("neon (PR-N3)", () => {
  it("normalizes storage/compute", async () => {
    const fetchImpl = mockFetch(200, {
      project: { synthetic_storage_size: 1234, compute_time_seconds: 50 },
    });
    const r = await createNeonAdapter({
      fetchImpl,
      allowInternal: true,
      env: { NEON_API_KEY: "k" },
    }).collect(svc({ providers: { neon: { projectId: "p1" } } }));
    expect(r.metrics).toEqual([
      { provider: "neon", key: "db_storage_bytes", value: 1234, unit: "bytes" },
      {
        provider: "neon",
        key: "db_compute_seconds",
        value: 50,
        unit: "seconds",
      },
    ]);
  });
});

describe("vercel (PR-N4)", () => {
  it("vercel last_deploy_at", async () => {
    const r = await createVercelAdapter({
      fetchImpl: mockFetch(200, {
        deployments: [{ createdAt: 1700000000000 }],
      }),
      allowInternal: true,
    }).collect(svc({ providers: { vercel: { projectId: "p" } } }));
    expect(r.metrics[0]).toMatchObject({
      key: "last_deploy_at",
      value: 1700000000000,
    });
  });
});

describe("service-info (PR-N6 / PR-B2)", () => {
  it("normalizes status + metrics", async () => {
    const body = {
      schemaVersion: 1,
      service: "svc",
      status: "ok",
      metrics: [{ key: "active_users_7d", value: 38, unit: "count" }],
    };
    const r = await createServiceInfoAdapter({
      fetchImpl: mockFetch(200, body),
      allowInternal: true,
    }).collect(
      svc({
        serviceInfo: {
          endpoint: "https://svc.example.com/api/hub/service-info",
        },
      }),
    );
    expect(r.metrics).toEqual([
      { provider: "service-info", key: "up", value: 1, unit: "bool" },
      {
        provider: "service-info",
        key: "active_users_7d",
        value: 38,
        unit: "count",
      },
    ]);
  });
  it("PR-B2: unknown schemaVersion → 既知部分のみ (クラッシュなし)", async () => {
    const body = { schemaVersion: 99, service: "svc", status: "down" };
    const r = await createServiceInfoAdapter({
      fetchImpl: mockFetch(200, body),
      allowInternal: true,
    }).collect(
      svc({
        serviceInfo: {
          endpoint: "https://svc.example.com/api/hub/service-info",
        },
      }),
    );
    expect(r.metrics[0]).toEqual({
      provider: "service-info",
      key: "up",
      value: 0,
      unit: "bool",
    });
  });

  it("PV-N4: metrics の mau をそのまま emit (自己申告, [D20260528-002])", async () => {
    const body = {
      schemaVersion: 1,
      service: "svc",
      status: "ok",
      metrics: [{ key: "mau", value: 1234, unit: "count" }],
    };
    const r = await createServiceInfoAdapter({
      fetchImpl: mockFetch(200, body),
      allowInternal: true,
    }).collect(
      svc({
        serviceInfo: {
          endpoint: "https://svc.example.com/api/hub/service-info",
        },
      }),
    );
    expect(r.metrics).toContainEqual({
      provider: "service-info",
      key: "mau",
      value: 1234,
      unit: "count",
    });
  });

  it("PV-N1/N2: 共通 HUB_SERVICE_INFO_SECRET があれば Bearer、なければヘッダなし", async () => {
    const seen: Array<Record<string, string> | undefined> = [];
    const captureFetch: typeof fetch = (async (
      _url: string,
      init?: RequestInit,
    ) => {
      seen.push(init?.headers as Record<string, string> | undefined);
      return new Response(
        JSON.stringify({ schemaVersion: 1, service: "svc", status: "ok" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as unknown as typeof fetch;
    const ep = {
      serviceInfo: { endpoint: "https://svc.example.com/api/hub/service-info" },
    };

    await createServiceInfoAdapter({
      fetchImpl: captureFetch,
      allowInternal: true,
      env: { HUB_SERVICE_INFO_SECRET: "shared-secret" },
    }).collect(svc(ep));
    await createServiceInfoAdapter({
      fetchImpl: captureFetch,
      allowInternal: true,
      env: {},
    }).collect(svc(ep));

    expect(seen[0]?.Authorization).toBe("Bearer shared-secret");
    expect(seen[1]?.Authorization).toBeUndefined();
  });

  // ── favicon-projection (revise_favicon-projection_20260528) ──────
  describe("iconUrl 抽出 + format check (FP-U-04/05/20-25/33)", () => {
    const ep = {
      serviceInfo: {
        endpoint: "https://svc.example.com/api/hub/service-info",
      },
    };
    const runAdapter = async (body: unknown) =>
      createServiceInfoAdapter({
        fetchImpl: mockFetch(200, body),
        allowInternal: true,
      }).collect(svc(ep));

    it("FP-U-04: v2 response 正常 iconUrl 抽出 → meta.iconUrl 返却", async () => {
      const r = await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: "https://svc.example.com/favicon.svg",
      });
      expect(r.meta?.iconUrl).toBe("https://svc.example.com/favicon.svg");
      expect(r.metrics[0]?.key).toBe("up");
    });

    it("FP-U-05: v1 producer (iconUrl 無し) → meta 未含有、metrics は正常", async () => {
      const r = await runAdapter({
        schemaVersion: 1,
        service: "svc",
        status: "ok",
      });
      expect(r.meta).toBeUndefined();
      expect(r.metrics[0]?.key).toBe("up");
    });

    it("FP-U-20: iconUrl http (https 必須) → 無視 + stderr 警告 (reason=protocol)", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const r = await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: "http://svc.example.com/favicon.svg",
      });
      expect(r.meta).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /service-info iconUrl rejected: slug=.* reason=protocol/,
        ),
      );
      warn.mockRestore();
    });

    it("FP-U-21: iconUrl 1024 chars 超 → 無視 + stderr 警告 (reason=length)", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const long = "https://svc.example.com/" + "a".repeat(1100);
      const r = await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: long,
      });
      expect(r.meta).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /service-info iconUrl rejected: slug=.* reason=length/,
        ),
      );
      warn.mockRestore();
    });

    it("FP-U-22: iconUrl 内部アドレス (SSRF 予防) → 無視 + stderr 警告 (reason=internal)", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const r = await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: "https://10.0.0.5/favicon.ico",
      });
      expect(r.meta).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /service-info iconUrl rejected: slug=.* reason=internal/,
        ),
      );
      warn.mockRestore();
    });

    it("FP-U-23: iconUrl 不正プロトコル (javascript:) → 無視 + stderr 警告", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const r = await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: "javascript:alert(1)",
      });
      expect(r.meta).toBeUndefined();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it("FP-U-24: iconUrl non-string (number) → 無視 + stderr 警告 (reason=type)", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const r = await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: 12345,
      });
      expect(r.meta).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /service-info iconUrl rejected: slug=.* reason=type rawType=number/,
        ),
      );
      warn.mockRestore();
    });

    it("FP-U-25: iconUrl 空文字 → 無視 + stderr 警告 (reason=empty)", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const r = await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: "",
      });
      expect(r.meta).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /service-info iconUrl rejected: slug=.* reason=empty/,
        ),
      );
      warn.mockRestore();
    });

    it("FP-U-33: 値そのものはログに含まれない (PII/secret 漏洩防止)", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sensitive = "https://10.0.0.5/admin?token=SECRET_VALUE_123";
      await runAdapter({
        schemaVersion: 2,
        service: "svc",
        status: "ok",
        iconUrl: sensitive,
      });
      // 全 warn call の引数を集めて sensitive 値が含まれていないことを確認
      const allArgs = warn.mock.calls.flat().join(" ");
      expect(allArgs).not.toContain("SECRET_VALUE_123");
      expect(allArgs).not.toContain("10.0.0.5");
      expect(allArgs).not.toContain(sensitive);
      // メタ情報のみが含まれる
      expect(allArgs).toContain("reason=");
      expect(allArgs).toContain("slug=");
      warn.mockRestore();
    });
  });
});

describe("errors (PR-E1/E2/E3/E4)", () => {
  it("timeout → {error:timeout}", async () => {
    const r = await createNeonAdapter({
      fetchImpl: throwFetch("aborted timeout"),
      allowInternal: true,
      env: {},
    }).collect(svc({ providers: { neon: { projectId: "p" } } }));
    expect(r.error).toBe("timeout");
    expect(r.metrics).toEqual([]);
  });
  it("401 → {error:auth}", async () => {
    const r = await createNeonAdapter({
      fetchImpl: mockFetch(401, {}),
      allowInternal: true,
      env: {},
    }).collect(svc({ providers: { neon: { projectId: "p" } } }));
    expect(r.error).toBe("auth");
  });
  it("429 → {error:rate_limited}", async () => {
    const r = await createNeonAdapter({
      fetchImpl: mockFetch(429, {}),
      allowInternal: true,
      env: {},
    }).collect(svc({ providers: { neon: { projectId: "p" } } }));
    expect(r.error).toBe("rate_limited");
  });
});

describe("getAdapters (PR-N7)", () => {
  it("selects ping + declared providers", () => {
    const list = getAdapters(
      svc({
        providers: { vercel: { projectId: "p" }, neon: { projectId: "n" } },
      }),
    );
    expect(list.map((a) => a.kind).sort()).toEqual(["neon", "ping", "vercel"]);
  });
  it("includes service-info when endpoint set", () => {
    const list = getAdapters(
      svc({ serviceInfo: { endpoint: "https://x.example.com/i" } }),
    );
    expect(list.map((a) => a.kind)).toContain("service-info");
  });
});
