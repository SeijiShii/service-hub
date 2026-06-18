import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseFeedbackSources,
  mergeFeedbackSources,
} from "./feedbackSources.js";
import type { ServiceDescriptor } from "../../types/index.js";

const SHIPYARD =
  '[{"slug":"shipyard","name":"Shipyard","url":"https://givers.work"}]';

function svc(slug: string, name = slug): ServiceDescriptor {
  return {
    slug,
    name,
    url: `https://${slug}.example.com`,
    status: "active",
    providers: {},
  };
}

describe("parseFeedbackSources", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it("RU-S1: 正常 JSON → 合成 descriptor (status=active, providers={})", () => {
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: SHIPYARD });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      slug: "shipyard",
      name: "Shipyard",
      url: "https://givers.work",
      status: "active",
      providers: {},
    });
  });

  it("RU-E1: env 未設定 / 空文字 → []", () => {
    expect(parseFeedbackSources({})).toEqual([]);
    expect(parseFeedbackSources({ HUB_FEEDBACK_SOURCES: "" })).toEqual([]);
    expect(parseFeedbackSources({ HUB_FEEDBACK_SOURCES: "  " })).toEqual([]);
  });

  it("RU-E2: 不正 JSON → [] + warn (throw しない)", () => {
    expect(parseFeedbackSources({ HUB_FEEDBACK_SOURCES: "{not json" })).toEqual(
      [],
    );
    expect(warn).toHaveBeenCalled();
  });

  it("RU-E2b: 配列でない JSON → []", () => {
    expect(
      parseFeedbackSources({ HUB_FEEDBACK_SOURCES: '{"slug":"x"}' }),
    ).toEqual([]);
  });

  it("RU-E3: 非安全 url (http / 内部 host) のエントリは skip、安全分は採用", () => {
    const raw = JSON.stringify([
      { slug: "bad", name: "Bad", url: "http://givers.work" },
      { slug: "internal", name: "Internal", url: "https://localhost/x" },
      { slug: "ok", name: "Ok", url: "https://ok.example.com" },
    ]);
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: raw });
    expect(out.map((s) => s.slug)).toEqual(["ok"]);
    expect(warn).toHaveBeenCalled();
  });

  it("RU-E4: slug 正規表現外 / name 空 は skip", () => {
    const raw = JSON.stringify([
      { slug: "Bad Slug", name: "X", url: "https://a.example.com" },
      { slug: "ok", name: "", url: "https://b.example.com" },
      { slug: "good", name: "Good", url: "https://c.example.com" },
    ]);
    const out = parseFeedbackSources({ HUB_FEEDBACK_SOURCES: raw });
    expect(out.map((s) => s.slug)).toEqual(["good"]);
  });

  it("RU-B1: url ちょうど 1024 chars は採用 / 1025 は skip", () => {
    const base = "https://e.example.com/";
    const ok = base + "a".repeat(1024 - base.length);
    const tooLong = base + "a".repeat(1025 - base.length);
    expect(ok).toHaveLength(1024);
    expect(tooLong).toHaveLength(1025);
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
    const out = mergeFeedbackSources([svc("a")], [svc("shipyard")]);
    expect(out.map((s) => s.slug).sort()).toEqual(["a", "shipyard"]);
  });

  it("RU-S3: slug 重複は registered 優先 (env 側を捨てる)", () => {
    const reg = svc("shipyard", "Registered");
    const env = svc("shipyard", "EnvSource");
    const out = mergeFeedbackSources([reg], [env]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Registered");
  });

  it("RU-B2: env=[] は registered のみ返す", () => {
    const out = mergeFeedbackSources([svc("a")], []);
    expect(out.map((s) => s.slug)).toEqual(["a"]);
  });
});
