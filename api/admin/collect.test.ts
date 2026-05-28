import { describe, it, expect, beforeEach, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import type { CollectionRun } from "../../src/types/index.js";

// 認証 + runCollection + その他依存をモック。本物が走ると DB/API を叩いてしまうため。
const h = vi.hoisted(() => ({
  authed: true,
  runImpl: (): Promise<CollectionRun> =>
    Promise.resolve({
      id: "r-test",
      startedAt: "2026-05-28T03:00:00.000Z",
      finishedAt: "2026-05-28T03:00:30.000Z",
      status: "ok",
      servicesCount: 2,
    }),
  runCalls: 0,
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
  upsertSnapshots: async () => {},
  recordRun: async () => {},
  recordAlert: async () => {},
  resolveAlert: async () => {},
  markAlertNotified: async () => {},
  openAlerts: async () => [],
}));

vi.mock("../../src/registry/index.js", () => ({
  loadServices: async () => [],
}));

vi.mock("../../src/providers/index.js", () => ({
  getAdapters: () => [],
}));

vi.mock("../../src/features/collection/index.js", () => ({
  runCollection: async () => {
    h.runCalls += 1;
    return h.runImpl();
  },
}));

vi.mock("../../src/features/alerts/index.js", () => ({
  evaluate: async () => [],
  notify: async () => {},
}));

import handler from "./collect.js";

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
  method: "POST",
  query: {},
  headers: {},
  ...over,
});

beforeEach(() => {
  h.authed = true;
  h.runCalls = 0;
  h.runImpl = () =>
    Promise.resolve({
      id: "r-test",
      startedAt: "2026-05-28T03:00:00.000Z",
      finishedAt: "2026-05-28T03:00:30.000Z",
      status: "ok",
      servicesCount: 2,
    });
});

describe("/api/admin/collect (force-pull)", () => {
  it("FP-E1: 未認証 POST → 401 / runCollection 呼ばれない", async () => {
    h.authed = false;
    const { res, out } = mockRes();
    await handler(req({ method: "POST" }), res);
    expect(out.code).toBe(401);
    expect(h.runCalls).toBe(0);
  });

  it("FP-N1+N2: 認証成功 POST → 200 + CollectionRun + runCollection 1 回", async () => {
    const { res, out } = mockRes();
    await handler(req({ method: "POST" }), res);
    expect(out.code).toBe(200);
    const body = out.body as CollectionRun;
    expect(body.id).toBe("r-test");
    expect(body.status).toBe("ok");
    expect(body.servicesCount).toBe(2);
    expect(h.runCalls).toBe(1);
  });

  it("FP-E2: GET → 405 method_not_allowed", async () => {
    const { res, out } = mockRes();
    await handler(req({ method: "GET" }), res);
    expect(out.code).toBe(405);
    expect(h.runCalls).toBe(0);
  });

  it("FP-E3: runCollection が throw → 500 internal (client に詳細出さない)", async () => {
    h.runImpl = () => Promise.reject(new Error("boom"));
    const { res, out } = mockRes();
    await handler(req({ method: "POST" }), res);
    expect(out.code).toBe(500);
    expect(out.body).toEqual({ error: "internal" });
  });

  it("FP-B1: servicesCount=0 (空 registry) でも 200 + servicesCount=0", async () => {
    h.runImpl = () =>
      Promise.resolve({
        id: "r-empty",
        startedAt: "2026-05-28T03:00:00.000Z",
        finishedAt: "2026-05-28T03:00:00.100Z",
        status: "ok",
        servicesCount: 0,
      });
    const { res, out } = mockRes();
    await handler(req({ method: "POST" }), res);
    expect(out.code).toBe(200);
    expect((out.body as CollectionRun).servicesCount).toBe(0);
  });
});
