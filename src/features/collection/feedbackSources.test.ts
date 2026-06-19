import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseFeedbackSources,
  mergeFeedbackSources,
  registeredToSource,
  type FeedbackSource,
} from "./feedbackSources.js";
import type { ServiceDescriptor } from "../../types/index.js";

const SHIPYARD =
  '[{"slug":"shipyard","name":"Shipyard","url":"https://givers.work"}]';

function src(slug: string, name = slug): FeedbackSource {
  return { slug, name, url: `https://${slug}.example.com`, kind: "feedback" };
}

describe("parseFeedbackSources", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it("RU-S1: 正常 JSON → FeedbackSource (kind 既定 feedback)", () => {
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: SHIPYARD });
    expect(out).toEqual([
      { slug: "shipyard", name: "Shipyard", url: "https://givers.work", kind: "feedback" },
    ]);
  });

  it("RI-S1: kind:inquiries を解釈", () => {
    const raw = JSON.stringify([
      { slug: "shipyard", name: "Shipyard", url: "https://givers.work", kind: "inquiries" },
    ]);
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: raw });
    expect(out[0].kind).toBe("inquiries");
  });

  it("RI-S2: kind 省略は feedback", () => {
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: SHIPYARD });
    expect(out[0].kind).toBe("feedback");
  });

  it("RI-E1: 未知 kind は skip + warn", () => {
    const raw = JSON.stringify([
      { slug: "bad", name: "Bad", url: "https://a.example.com", kind: "foo" },
      { slug: "ok", name: "Ok", url: "https://b.example.com", kind: "inquiries" },
    ]);
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: raw });
    expect(out.map((s) => s.slug)).toEqual(["ok"]);
    expect(warn).toHaveBeenCalled();
  });

  it("RU-E1: env 未設定 / 空文字 → []", () => {
    expect(parseFeedbackSources({})).toEqual([]);
    expect(parseFeedbackSources({ HUB_FEEDBACK_SOURCES: "" })).toEqual([]);
    expect(parseFeedbackSources({ HUB_FEEDBACK_SOURCES: "  " })).toEqual([]);
  });

  it("RU-E2: 不正 JSON → [] + warn", () => {
    expect(parseFeedbackSources({ HUB_FEEDBACK_SOURCES: "{not json" })).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("RU-E2b: 配列でない JSON → []", () => {
    expect(parseFeedbackSources({ HUB_FEEDBACK_SOURCES: '{"slug":"x"}' })).toEqual([]);
  });

  it("RU-E3: 非安全 url の entry skip、安全分採用", () => {
    const raw = JSON.stringify([
      { slug: "bad", name: "Bad", url: "http://givers.work" },
      { slug: "internal", name: "Internal", url: "https://localhost/x" },
      { slug: "ok", name: "Ok", url: "https://ok.example.com" },
    ]);
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: raw });
    expect(out.map((s) => s.slug)).toEqual(["ok"]);
    expect(warn).toHaveBeenCalled();
  });

  it("RU-E4: slug 正規表現外 / name 空 skip", () => {
    const raw = JSON.stringify([
      { slug: "Bad Slug", name: "X", url: "https://a.example.com" },
      { slug: "ok", name: "", url: "https://b.example.com" },
      { slug: "good", name: "Good", url: "https://c.example.com" },
    ]);
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: raw });
    expect(out.map((s) => s.slug)).toEqual(["good"]);
  });

  it("RU-B1: url 1024 採用 / 1025 skip", () => {
    const base = "https://e.example.com/";
    const ok = base + "a".repeat(1024 - base.length);
    const tooLong = base + "a".repeat(1025 - base.length);
    const raw = JSON.stringify([
      { slug: "ok", name: "Ok", url: ok },
      { slug: "toolong", name: "Too", url: tooLong },
    ]);
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: raw });
    expect(out.map((s) => s.slug)).toEqual(["ok"]);
  });
});

describe("mergeFeedbackSources", () => {
  it("RU-S2: registered + env を両方含む", () => {
    const out = mergeFeedbackSources([src("a")], [src("shipyard")]);
    expect(out.map((s) => s.slug).sort()).toEqual(["a", "shipyard"]);
  });

  it("RU-S3: slug 重複は registered 優先", () => {
    const out = mergeFeedbackSources([src("shipyard", "Registered")], [src("shipyard", "Env")]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Registered");
  });

  it("RU-B2: env=[] は registered のみ", () => {
    expect(mergeFeedbackSources([src("a")], []).map((s) => s.slug)).toEqual(["a"]);
  });
});

describe("registeredToSource", () => {
  it("serviceInfo.endpoint を url に採用 (origin 派生 base)", () => {
    const desc: ServiceDescriptor = {
      slug: "hana",
      name: "Hana",
      url: "https://hana.example.com",
      status: "active",
      providers: {},
      serviceInfo: { endpoint: "https://hana.example.com/api/hub/service-info" },
    };
    const s = registeredToSource(desc);
    expect(s).toEqual({
      slug: "hana",
      name: "Hana",
      url: "https://hana.example.com/api/hub/service-info",
      kind: "feedback",
    });
  });

  it("serviceInfo 不在なら url を採用", () => {
    const desc: ServiceDescriptor = {
      slug: "n",
      name: "N",
      url: "https://n.example.com",
      status: "active",
      providers: {},
    };
    expect(registeredToSource(desc).url).toBe("https://n.example.com");
  });
});
