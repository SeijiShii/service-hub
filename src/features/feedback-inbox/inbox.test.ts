import { describe, it, expect } from "vitest";
import {
  parseFeedbackFilter,
  buildClaimText,
  buildInboxVM,
  type FeedbackInboxItem,
} from "./inbox.js";
import type { FeedbackItemRow } from "../../types/index.js";

const NOW = Date.parse("2026-06-18T00:00:00.000Z");

const row = (over: Partial<FeedbackItemRow> = {}): FeedbackItemRow => ({
  serviceSlug: "hana-memo",
  externalId: "fb-1",
  kind: "feedback",
  body: "便利",
  createdAt: "2026-06-10T00:00:00.000Z",
  pulledAt: "2026-06-18T00:00:00.000Z",
  ...over,
});

describe("feedback-inbox view model", () => {
  it("parseFeedbackFilter: service/kind/period を取り込む", () => {
    const f = parseFeedbackFilter(
      { service: "naze-bako", kind: "bug", period: "7d" },
      NOW,
    );
    expect(f.service).toBe("naze-bako");
    expect(f.kind).toBe("bug");
    expect(f.since).toBe("2026-06-11T00:00:00.000Z");
  });

  it("parseFeedbackFilter: 不正 kind は無視、period 既定は 30d", () => {
    const f = parseFeedbackFilter({ kind: "weird" }, NOW);
    expect(f.kind).toBeUndefined();
    expect(f.since).toBe("2026-05-19T00:00:00.000Z"); // 30d 前
  });

  it("parseFeedbackFilter: period=all は epoch 起点", () => {
    const f = parseFeedbackFilter({ period: "all" }, NOW);
    expect(Date.parse(f.since!)).toBe(0);
  });

  it("U-09: buildClaimText はサービス名/kind/本文を含む", () => {
    const item: FeedbackInboxItem = {
      ...row({ kind: "bug", body: "落ちる", rating: 1, status: "open" }),
      serviceName: "ハナメモ",
    };
    const t = buildClaimText(item);
    expect(t).toContain("ハナメモ");
    expect(t).toContain("bug");
    expect(t).toContain("落ちる");
    expect(t).toContain("rating: 1");
    expect(t).toContain("status: open");
  });

  it("buildInboxVM: slug→name 解決 + サービス一覧", () => {
    const vm = buildInboxVM(
      [row({ serviceSlug: "hana-memo" }), row({ serviceSlug: "unknown", externalId: "x" })],
      [{ slug: "hana-memo", name: "ハナメモ" }],
    );
    expect(vm.items[0].serviceName).toBe("ハナメモ");
    // 未登録 slug は slug をそのまま
    expect(vm.items[1].serviceName).toBe("unknown");
    expect(vm.services).toEqual([{ slug: "hana-memo", name: "ハナメモ" }]);
  });
});
