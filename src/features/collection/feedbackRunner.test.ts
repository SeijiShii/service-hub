import { describe, it, expect } from "vitest";
import { runFeedbackCollection } from "./feedbackRunner.js";
import type { ServiceDescriptor, FeedbackItemRow } from "../../types/index.js";
import type { FeedbackFetchResult } from "../../providers/feedback.js";

const svc = (slug: string): ServiceDescriptor => ({
  slug,
  name: slug,
  url: `https://${slug}.example.com`,
  status: "active",
  providers: {},
});

const item = (slug: string, id: string): FeedbackItemRow => ({
  serviceSlug: slug,
  externalId: id,
  kind: "feedback",
  body: "x",
  createdAt: "2026-06-10T00:00:00.000Z",
  pulledAt: "2026-06-18T00:00:00.000Z",
});

describe("runFeedbackCollection (feedback-inbox orchestration, R1)", () => {
  it("U-11: 全サービス pull → saveFeedback に集約", async () => {
    const saved: FeedbackItemRow[] = [];
    const map: Record<string, FeedbackFetchResult> = {
      "a": { items: [item("a", "1"), item("a", "2")] },
      "b": { items: [item("b", "1")] },
    };
    const summary = await runFeedbackCollection({
      loadServices: async () => [svc("a"), svc("b")],
      fetchFeedback: async (s) => map[s.slug],
      saveFeedback: async (rows) => {
        saved.push(...rows);
      },
    });
    expect(saved).toHaveLength(3);
    expect(summary.servicesCount).toBe(2);
    expect(summary.itemsPulled).toBe(3);
    expect(summary.errors).toEqual([]);
  });

  it("pull error はサマリに記録 (collection_runs に混ぜない、R3)", async () => {
    const summary = await runFeedbackCollection({
      loadServices: async () => [svc("a")],
      fetchFeedback: async () => ({ items: [], error: "feedback:404" }),
      saveFeedback: async () => {},
    });
    expect(summary.errors).toEqual([
      { serviceSlug: "a", message: "feedback:404" },
    ]);
  });

  it("U-27: 1 サービスの例外が他をブロックしない", async () => {
    const saved: FeedbackItemRow[] = [];
    const summary = await runFeedbackCollection({
      loadServices: async () => [svc("boom"), svc("ok")],
      fetchFeedback: async (s) => {
        if (s.slug === "boom") throw new Error("network down");
        return { items: [item("ok", "1")] };
      },
      saveFeedback: async (rows) => {
        saved.push(...rows);
      },
    });
    expect(saved.map((r) => r.serviceSlug)).toEqual(["ok"]);
    expect(summary.errors[0]).toEqual({
      serviceSlug: "boom",
      message: "network down",
    });
    expect(summary.itemsPulled).toBe(1);
  });

  it("saveFeedback 失敗は summary.errors に '*' で記録", async () => {
    const summary = await runFeedbackCollection({
      loadServices: async () => [svc("a")],
      fetchFeedback: async () => ({ items: [item("a", "1")] }),
      saveFeedback: async () => {
        throw new Error("db gone");
      },
    });
    expect(summary.errors).toContainEqual({
      serviceSlug: "*",
      message: "db: db gone",
    });
  });
});
