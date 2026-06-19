import { describe, it, expect } from "vitest";
import { fetchInquiries, inquiriesEndpoint } from "./inquiries.js";
import { fetchFromSource } from "../features/collection/fetchSource.js";
import type { FeedbackSource } from "../features/collection/feedbackSources.js";

const SRC: FeedbackSource = {
  slug: "shipyard",
  name: "Shipyard",
  url: "https://givers.work",
  kind: "inquiries",
};

function mockFetch(status: number, body: unknown): typeof fetch {
  return (async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  })) as unknown as typeof fetch;
}

const deps = (f: typeof fetch) => ({
  fetchImpl: f,
  allowInternal: true,
  env: { HUB_SERVICE_INFO_SECRET: "s3cret" },
  now: () => new Date("2026-06-19T00:00:00.000Z"),
});

function resp(items: unknown[], over: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    service: "shipyard",
    items,
    nextCursor: null,
    ...over,
  };
}

const fullItem = {
  id: "thread-1",
  kind: "inquiry",
  subject: "プランについて",
  body: "有料プランの違いを教えてください",
  email: "visitor@example.com",
  createdAt: "2026-06-18T00:00:00Z",
  status: "open",
  adminUrl: "https://givers.work/admin/inquiries/thread-1",
  threadToken: "SECRET-IDOR-TOKEN",
};

describe("inquiriesEndpoint", () => {
  it("origin + /api/hub/inquiries で派生", () => {
    expect(inquiriesEndpoint(SRC)).toBe(
      "https://givers.work/api/hub/inquiries",
    );
  });
});

describe("fetchInquiries", () => {
  it("RI-S3: email/adminUrl/subject を context に取り込む + kind=inquiry", async () => {
    const r = await fetchInquiries(SRC, deps(mockFetch(200, resp([fullItem]))));
    expect(r.error).toBeUndefined();
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({
      serviceSlug: "shipyard",
      externalId: "thread-1",
      kind: "inquiry",
      body: "有料プランの違いを教えてください",
      status: "open",
    });
    expect(r.items[0].context).toEqual({
      email: "visitor@example.com",
      adminUrl: "https://givers.work/admin/inquiries/thread-1",
      subject: "プランについて",
    });
  });

  it("RI-E2: threadToken は context に入れない (SEC-002 破棄)", async () => {
    const r = await fetchInquiries(SRC, deps(mockFetch(200, resp([fullItem]))));
    expect(JSON.stringify(r.items[0])).not.toContain("SECRET-IDOR-TOKEN");
    expect(r.items[0].context).not.toHaveProperty("threadToken");
  });

  it("RI-E4: email/adminUrl/subject 欠落 item → context なしで取り込み", async () => {
    const r = await fetchInquiries(
      SRC,
      deps(
        mockFetch(
          200,
          resp([
            { id: "t2", body: "本文のみ", createdAt: "2026-06-18T00:00:00Z" },
          ]),
        ),
      ),
    );
    expect(r.items).toHaveLength(1);
    expect(r.items[0].context).toBeUndefined();
    expect(r.items[0].kind).toBe("inquiry");
  });

  it("RI-E5: 非安全 adminUrl は context に入れない (他フィールドは取り込む)", async () => {
    const r = await fetchInquiries(
      SRC,
      deps(
        mockFetch(
          200,
          resp([
            {
              id: "t3",
              body: "x",
              email: "a@b.com",
              adminUrl: "http://insecure/admin", // https でない
              createdAt: "2026-06-18T00:00:00Z",
            },
          ]),
        ),
      ),
    );
    expect(r.items[0].context).toEqual({ email: "a@b.com" });
    expect(r.items[0].context).not.toHaveProperty("adminUrl");
  });

  it("RI-E3: 401 / 404 / badschema は skip (throw しない)", async () => {
    expect((await fetchInquiries(SRC, deps(mockFetch(401, {})))).error).toBe(
      "inquiries:401",
    );
    expect((await fetchInquiries(SRC, deps(mockFetch(404, {})))).error).toBe(
      "inquiries:404",
    );
    const bad = await fetchInquiries(
      SRC,
      deps(mockFetch(200, { items: "nope" })),
    );
    expect(bad.error).toBe("inquiries:badschema");
    expect(bad.items).toEqual([]);
  });

  it("RI-B1: items=[] は空 graceful", async () => {
    const r = await fetchInquiries(SRC, deps(mockFetch(200, resp([]))));
    expect(r.items).toEqual([]);
    expect(r.error).toBeUndefined();
  });

  it("不正 item (id 欠落 / body 空 / createdAt 不正) は skip", async () => {
    const r = await fetchInquiries(
      SRC,
      deps(
        mockFetch(
          200,
          resp([
            { body: "no id", createdAt: "2026-06-18T00:00:00Z" },
            { id: "x", body: "", createdAt: "2026-06-18T00:00:00Z" },
            { id: "y", body: "ok", createdAt: "not-a-date" },
            { id: "z", body: "good", createdAt: "2026-06-18T00:00:00Z" },
          ]),
        ),
      ),
    );
    expect(r.items.map((i) => i.externalId)).toEqual(["z"]);
  });
});

describe("fetchFromSource dispatch (RI-S4)", () => {
  it("kind=inquiries は inquiries エンドポイントを叩く", async () => {
    const urls: string[] = [];
    const f = (async (u: string) => {
      urls.push(u);
      return { status: 200, ok: true, json: async () => resp([]) };
    }) as unknown as typeof fetch;
    await fetchFromSource(SRC, { fetchImpl: f, allowInternal: true, env: {} });
    expect(urls[0]).toBe("https://givers.work/api/hub/inquiries");
  });

  it("kind=feedback は feedback エンドポイントを叩く", async () => {
    const urls: string[] = [];
    const f = (async (u: string) => {
      urls.push(u);
      return {
        status: 200,
        ok: true,
        json: async () => ({ schemaVersion: 1, items: [] }),
      };
    }) as unknown as typeof fetch;
    await fetchFromSource(
      { slug: "a", name: "A", url: "https://a.example.com", kind: "feedback" },
      { fetchImpl: f, allowInternal: true, env: {} },
    );
    expect(urls[0]).toBe("https://a.example.com/api/hub/feedback");
  });
});
