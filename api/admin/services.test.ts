import { describe, it, expect, beforeEach, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import type { ServiceDescriptor } from "../../src/types/index.js";

// 認証 + DB をモック。validateServiceInput は実物 (検証を本物でテスト)。
const h = vi.hoisted(() => ({
  authed: true,
  store: new Map<string, ServiceDescriptor>(),
}));

vi.mock("../../src/auth/index.js", () => {
  class AuthError extends Error {
    constructor(
      public status: number,
      m: string,
    ) {
      super(m);
    }
  }
  return {
    AuthError,
    getAuthFromRequest: async () => ({ userId: h.authed ? "seiji" : null }),
    requireSeiji: (auth: { userId: string | null } | null) => {
      if (!auth?.userId) throw new AuthError(401, "unauthenticated");
      return { userId: auth.userId };
    },
  };
});

vi.mock("../../src/db/index.js", () => ({
  createDb: () => ({}),
  listServices: async () => [...h.store.values()],
  getService: async (_db: unknown, slug: string) => h.store.get(slug) ?? null,
  upsertService: async (_db: unknown, d: ServiceDescriptor) => {
    h.store.set(d.slug, d);
  },
  setServiceStatus: async (_db: unknown, slug: string, status: string) => {
    const s = h.store.get(slug);
    if (s) h.store.set(slug, { ...s, status: status as ServiceDescriptor["status"] });
  },
  deleteService: async (_db: unknown, slug: string) => {
    h.store.delete(slug);
  },
}));

import handler from "./services.js";

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
    setHeader() {
      return res;
    },
    end() {
      return res;
    },
  } as VercelResponse;
  return { res, out };
}

const req = (over: Partial<VercelRequest>): VercelRequest => ({
  method: "GET",
  query: {},
  headers: {},
  ...over,
});

const valid = {
  slug: "demo-svc",
  name: "Demo",
  url: "https://demo.example.com",
  status: "active",
  providers: { vercel: { projectId: "prj_1" } },
};

beforeEach(() => {
  h.authed = true;
  h.store.clear();
});

describe("/api/admin/services (admin write)", () => {
  it("U-15: 未認証 → 401、登録されない", async () => {
    h.authed = false;
    const { res, out } = mockRes();
    await handler(req({ method: "POST", body: valid }), res);
    expect(out.code).toBe(401);
    expect(h.store.size).toBe(0);
  });

  it("POST 正常 → 201 + 登録", async () => {
    const { res, out } = mockRes();
    await handler(req({ method: "POST", body: valid }), res);
    expect(out.code).toBe(201);
    expect(h.store.get("demo-svc")?.name).toBe("Demo");
  });

  it("U-10(write): 内部アドレス url → 400、登録されない", async () => {
    const { res, out } = mockRes();
    await handler(
      req({ method: "POST", body: { ...valid, url: "http://127.0.0.1" } }),
      res,
    );
    expect(out.code).toBe(400);
    expect(h.store.size).toBe(0);
  });

  it("U-14: 既存 slug を POST → 409", async () => {
    h.store.set("demo-svc", valid as ServiceDescriptor);
    const { res, out } = mockRes();
    await handler(req({ method: "POST", body: valid }), res);
    expect(out.code).toBe(409);
  });

  it("PATCH 未知 slug → 404", async () => {
    const { res, out } = mockRes();
    await handler(req({ method: "PATCH", query: { slug: "nope" }, body: valid }), res);
    expect(out.code).toBe(404);
  });

  it("PATCH 既存 → 200 + 更新", async () => {
    h.store.set("demo-svc", valid as ServiceDescriptor);
    const { res, out } = mockRes();
    await handler(
      req({ method: "PATCH", query: { slug: "demo-svc" }, body: { ...valid, name: "Demo v2" } }),
      res,
    );
    expect(out.code).toBe(200);
    expect(h.store.get("demo-svc")?.name).toBe("Demo v2");
  });

  it("DELETE 既定 → retire (論理削除、行は残る)", async () => {
    h.store.set("demo-svc", valid as ServiceDescriptor);
    const { res, out } = mockRes();
    await handler(req({ method: "DELETE", query: { slug: "demo-svc" } }), res);
    expect(out.code).toBe(200);
    expect(h.store.get("demo-svc")?.status).toBe("retired");
  });

  it("DELETE ?hard=1 → 物理削除", async () => {
    h.store.set("demo-svc", valid as ServiceDescriptor);
    const { res, out } = mockRes();
    await handler(
      req({ method: "DELETE", query: { slug: "demo-svc", hard: "1" } }),
      res,
    );
    expect(out.code).toBe(200);
    expect(h.store.has("demo-svc")).toBe(false);
  });

  it("PUT → 405", async () => {
    const { res, out } = mockRes();
    await handler(req({ method: "PUT" }), res);
    expect(out.code).toBe(405);
  });
});
