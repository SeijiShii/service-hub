/**
 * feedback 収集オーケストレーション ([論点-007]/O67、spec-review R1)。
 *
 * **runner.ts (`runCollection`) とは別関数**。metrics 収集の per-service×per-adapter ループ
 * (単一 capturedAt / 非有限 skip / batch insert invariant) に feedback (item list) を混ぜず、
 * 責務を分離する。`api/cron/collect.ts` で runCollection と並行 invoke する。
 *
 * R3: エラーは collection_runs (provider: ProviderKind) に混ぜず、本関数の戻り値サマリに記録する。
 */
import type { FeedbackItemRow } from "../../types/index.js";
import type { FeedbackFetchResult } from "../../providers/feedback.js";
import type { FeedbackSource } from "./feedbackSources.js";

export interface FeedbackRunnerDeps {
  /** feedback pull 対象 (registered active ∪ env ソース、kind 付き)。 */
  loadServices: () => Promise<FeedbackSource[]>;
  /** 1 ソースの feedback を pull (kind 別 dispatch、throw せず {items, error?} を返す)。 */
  fetchFeedback: (s: FeedbackSource) => Promise<FeedbackFetchResult>;
  /** pull した行を保存 (冪等 upsert)。 */
  saveFeedback: (rows: FeedbackItemRow[]) => Promise<void>;
}

export interface FeedbackRunSummary {
  servicesCount: number;
  itemsPulled: number;
  errors: { serviceSlug: string; message: string }[];
}

/**
 * 全 active サービスの feedback を pull → 保存。throw せず summary を返す。
 * 1 サービスの失敗 (pull error / 例外) は他サービスをブロックしない (per-service try/catch)。
 */
export async function runFeedbackCollection(
  deps: FeedbackRunnerDeps,
): Promise<FeedbackRunSummary> {
  const services = await deps.loadServices();
  const rows: FeedbackItemRow[] = [];
  const errors: FeedbackRunSummary["errors"] = [];

  for (const svc of services) {
    try {
      const res = await deps.fetchFeedback(svc);
      if (res.error) errors.push({ serviceSlug: svc.slug, message: res.error });
      for (const item of res.items) rows.push(item);
    } catch (e) {
      errors.push({
        serviceSlug: svc.slug,
        message: e instanceof Error ? e.message : "error",
      });
    }
  }

  try {
    await deps.saveFeedback(rows);
  } catch (e) {
    errors.push({
      serviceSlug: "*",
      message: `db: ${e instanceof Error ? e.message : "error"}`,
    });
  }

  return {
    servicesCount: services.length,
    itemsPulled: rows.length,
    errors,
  };
}
