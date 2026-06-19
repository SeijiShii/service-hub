/**
 * inquiries pull adapter (inquiries-reply-channel revise)。
 *
 * shipyard 等の `GET /api/hub/inquiries` を pull し、返信導線情報 (email 生 / adminUrl / subject) を
 * 付けた FeedbackItemRow[] を返す。標準 `/api/hub/feedback` (scrubbed、email なし) との違いは
 * 「email/adminUrl/subject を context jsonb に取り込む」点のみ (DB スキーマ変更なし)。
 *
 * SEC (AI_LOG D20260619-021/029):
 * - email は認証済み運営者の返信チャネル (producer が意図供給、SEC-001 禁止 sink でない)。HUB inbox は Clerk ゲート内。
 * - threadToken は受信しても**破棄** (SEC-002 IDOR キーを HUB に複製しない)。
 * - adminUrl は Clerk ガード deep-link。isSafePublicUrl 検証を通したものだけ context に入れる。
 */
import type { FeedbackItemRow } from "../types/index.js";
import { FEEDBACK_BODY_MAX } from "../types/index.js";
import type { FeedbackSource } from "../features/collection/feedbackSources.js";
import type { FeedbackFetchDeps, FeedbackFetchResult } from "./feedback.js";
import { safeFetch } from "./fetch.js";
import { isSafePublicUrl } from "../lib/safeUrl.js";

const FIXED_PATH = "/api/hub/inquiries";

/** inquiries エンドポイント URL を origin 派生で解決。解決不能なら null。 */
export function inquiriesEndpoint(src: FeedbackSource): string | null {
  try {
    return `${new URL(src.url).origin}${FIXED_PATH}`;
  } catch {
    return null;
  }
}

/** 1 inquiry item を検証して FeedbackItemRow に変換。不正なら null (skip)。 */
function validateInquiry(
  raw: unknown,
  serviceSlug: string,
  pulledAt: string,
): FeedbackItemRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const externalId = typeof r.id === "string" ? r.id : "";
  if (!externalId) return null;
  if (typeof r.body !== "string" || r.body.length === 0) return null;
  if (typeof r.createdAt !== "string" || Number.isNaN(Date.parse(r.createdAt)))
    return null;

  let body = r.body;
  if (body.length > FEEDBACK_BODY_MAX) body = body.slice(0, FEEDBACK_BODY_MAX);

  // 返信導線を context jsonb に取り込む (DB スキーマ変更なし)。threadToken は意図的に無視。
  const context: Record<string, unknown> = {};
  if (typeof r.email === "string" && r.email.length > 0) context.email = r.email;
  if (typeof r.adminUrl === "string" && isSafePublicUrl(r.adminUrl))
    context.adminUrl = r.adminUrl;
  if (typeof r.subject === "string" && r.subject.length > 0)
    context.subject = r.subject;

  const row: FeedbackItemRow = {
    serviceSlug,
    externalId,
    kind: "inquiry", // inquiries エンドポイントは全て問い合わせ
    body,
    createdAt: new Date(r.createdAt).toISOString(),
    pulledAt,
  };
  if (typeof r.status === "string") row.status = r.status;
  if (Object.keys(context).length > 0) row.context = context;
  return row;
}

/**
 * 1 ソースの inquiries を pull。throw せず {items, error?} を返す
 * (per-source: 1 ソースの失敗が他をブロックしない、feedback と同方針)。
 */
export async function fetchInquiries(
  src: FeedbackSource,
  deps: FeedbackFetchDeps = {},
): Promise<FeedbackFetchResult> {
  const url = inquiriesEndpoint(src);
  if (!url) return { items: [], error: "inquiries:no_endpoint" };
  const pulledAt = (deps.now?.() ?? new Date()).toISOString();
  const secret = deps.env?.HUB_SERVICE_INFO_SECRET;
  try {
    const res = await safeFetch(url, {
      fetchImpl: deps.fetchImpl,
      allowInternal: deps.allowInternal,
      headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
    });
    if (res.status === 401 || res.status === 403)
      return { items: [], error: "inquiries:401" };
    if (res.status === 404) return { items: [], error: "inquiries:404" };
    if (!res.ok) return { items: [], error: `inquiries:http_${res.status}` };
    const j = (await res.json()) as Record<string, unknown>;
    if (typeof j?.schemaVersion !== "number" || !Array.isArray(j.items)) {
      console.warn(`inquiries badschema: slug=${src.slug}`);
      return { items: [], error: "inquiries:badschema" };
    }
    const items: FeedbackItemRow[] = [];
    for (const raw of j.items) {
      const row = validateInquiry(raw, src.slug, pulledAt);
      if (row) items.push(row);
    }
    return { items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return {
      items: [],
      error: /timeout|abort/i.test(msg) ? "inquiries:timeout" : "inquiries:error",
    };
  }
}
