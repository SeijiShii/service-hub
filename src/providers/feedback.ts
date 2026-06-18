/**
 * feedback pull adapter ([論点-007]/O67 consumer)。各サービスの `GET /api/hub/feedback` を
 * `HUB_SERVICE_INFO_SECRET` で pull し、検証済み FeedbackItemRow[] を返す。
 *
 * spec-review 反映:
 * - R1: ProviderAdapter/UsageMetric とは別責務 (metrics 収集ループに混ぜない)。本 adapter は list 取得専用。
 * - R2: endpoint は service-info endpoint (or s.url) の origin + 固定パス `/api/hub/feedback` で派生 (registry field 追加なし)。
 * - R4: `safeFetch` を直接利用 (adapters.ts の private getJson は複製しない)。SSRF/timeout/redirect 抑止は safeFetch が担保。
 */
import type { ServiceDescriptor, FeedbackItemRow, FeedbackKind } from "../types/index.js";
import { FEEDBACK_KINDS, FEEDBACK_BODY_MAX } from "../types/index.js";
import { safeFetch } from "./fetch.js";

export interface FeedbackFetchDeps {
  fetchImpl?: typeof fetch;
  allowInternal?: boolean; // テスト用
  env?: Record<string, string | undefined>;
  now?: () => Date;
}

export interface FeedbackFetchResult {
  items: FeedbackItemRow[];
  /** "feedback:404" | "feedback:401" | "feedback:timeout" | "feedback:badschema" | "feedback:http_<n>" 等。 */
  error?: string;
}

const FIXED_PATH = "/api/hub/feedback";

/** feedback エンドポイント URL を origin 派生で解決 (R2)。解決不能なら null。 */
export function feedbackEndpoint(s: ServiceDescriptor): string | null {
  const base = s.serviceInfo?.endpoint || s.url;
  try {
    return `${new URL(base).origin}${FIXED_PATH}`;
  } catch {
    return null;
  }
}

const KIND_SET = new Set<string>(FEEDBACK_KINDS);

/** 1 item を検証して FeedbackItemRow に変換。不正なら null (skip)。 */
function validateItem(
  raw: unknown,
  serviceSlug: string,
  pulledAt: string,
): FeedbackItemRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const externalId = typeof r.id === "string" ? r.id : "";
  if (!externalId) return null;
  if (typeof r.kind !== "string" || !KIND_SET.has(r.kind)) return null; // 未知 kind は skip
  if (typeof r.body !== "string" || r.body.length === 0) return null;
  if (typeof r.createdAt !== "string" || Number.isNaN(Date.parse(r.createdAt)))
    return null;
  let body = r.body;
  if (body.length > FEEDBACK_BODY_MAX) {
    console.warn(
      `feedback body capped: slug=${serviceSlug} id=${externalId} len=${body.length}`,
    );
    body = body.slice(0, FEEDBACK_BODY_MAX);
  }
  const row: FeedbackItemRow = {
    serviceSlug,
    externalId,
    kind: r.kind as FeedbackKind,
    body,
    createdAt: new Date(r.createdAt).toISOString(),
    pulledAt,
  };
  if (typeof r.rating === "number" && Number.isFinite(r.rating))
    row.rating = r.rating;
  if (r.context && typeof r.context === "object")
    row.context = r.context as Record<string, unknown>;
  if (typeof r.status === "string") row.status = r.status;
  return row;
}

/**
 * 1 サービスの feedback を pull。throw せず {items, error?} を返す (1 サービスの失敗が
 * 他サービスをブロックしない、runFeedbackCollection の per-service 方針)。
 */
export async function fetchFeedback(
  s: ServiceDescriptor,
  deps: FeedbackFetchDeps = {},
): Promise<FeedbackFetchResult> {
  const url = feedbackEndpoint(s);
  if (!url) return { items: [], error: "feedback:no_endpoint" };
  const pulledAt = (deps.now?.() ?? new Date()).toISOString();
  const secret = deps.env?.HUB_SERVICE_INFO_SECRET;
  try {
    const res = await safeFetch(url, {
      fetchImpl: deps.fetchImpl,
      allowInternal: deps.allowInternal,
      headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
    });
    if (res.status === 401 || res.status === 403)
      return { items: [], error: "feedback:401" };
    if (res.status === 404) return { items: [], error: "feedback:404" };
    if (!res.ok) return { items: [], error: `feedback:http_${res.status}` };
    const j = (await res.json()) as Record<string, unknown>;
    if (typeof j?.schemaVersion !== "number" || !Array.isArray(j.items)) {
      console.warn(`feedback badschema: slug=${s.slug}`);
      return { items: [], error: "feedback:badschema" };
    }
    const items: FeedbackItemRow[] = [];
    for (const raw of j.items) {
      const row = validateItem(raw, s.slug, pulledAt);
      if (row) items.push(row);
    }
    return { items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return {
      items: [],
      error: /timeout|abort/i.test(msg) ? "feedback:timeout" : "feedback:error",
    };
  }
}
