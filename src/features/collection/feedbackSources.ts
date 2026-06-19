/**
 * feedback ソース定義 (無登録 env ソース + endpoint 種別)。
 *
 * `services` レジストリに登録しなくても、env `HUB_FEEDBACK_SOURCES` で定義した外部ソースを
 * feedback pull 対象に加える (inbox-pull-source revise、claim C20260618-001 §5 supersede)。
 * `kind` で取り込みエンドポイントを切替える (inquiries-reply-channel revise):
 * - `feedback` (既定): 標準 `GET /api/hub/feedback` (PII scrub 済、email なし)。
 * - `inquiries`: shipyard `GET /api/hub/inquiries` (email 生 + adminUrl + subject、返信導線用)。
 *
 * 設計判断 (AI_LOG D20260619-004 / -020〜023):
 * - DB 登録不要・dashboard 監視対象外 (runFeedbackCollection のみに合流)。
 * - secret は既存 HUB_SERVICE_INFO_SECRET を共用。
 * - url は isSafePublicUrl で SSRF 予防、slug は registry と同正規表現。
 * - 不正 JSON 全体 → []、不正エントリ単体 → skip + warn。未知 kind は skip + warn。
 */
import type { ServiceDescriptor } from "../../types/index.js";
import { isSafePublicUrl } from "../../lib/safeUrl.js";

/** registry schema.ts serviceDescriptorSchema と同じ slug 制約。 */
const SLUG_RE = /^[a-z0-9-]+$/;

/** 取り込みエンドポイント種別。 */
export type FeedbackSourceKind = "feedback" | "inquiries";
const KIND_SET = new Set<FeedbackSourceKind>(["feedback", "inquiries"]);

/**
 * feedback pull 対象の単位。`url` は origin 派生の base
 * (registered は serviceInfo.endpoint || url、env ソースは設定値)。
 */
export interface FeedbackSource {
  slug: string;
  name: string;
  url: string;
  kind: FeedbackSourceKind;
}

/** env `HUB_FEEDBACK_SOURCES` (JSON `[{slug,name,url,kind?}]`) を FeedbackSource[] に parse。 */
export function parseFeedbackSources(
  env: Record<string, string | undefined> = {},
): FeedbackSource[] {
  const raw = env.HUB_FEEDBACK_SOURCES;
  if (!raw || raw.trim() === "") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn("HUB_FEEDBACK_SOURCES: invalid JSON, ignoring");
    return [];
  }
  if (!Array.isArray(parsed)) {
    console.warn("HUB_FEEDBACK_SOURCES: not a JSON array, ignoring");
    return [];
  }

  const out: FeedbackSource[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      console.warn("HUB_FEEDBACK_SOURCES: non-object entry skipped");
      continue;
    }
    const e = entry as Record<string, unknown>;
    const { slug, name, url, kind } = e;
    if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
      console.warn("HUB_FEEDBACK_SOURCES: invalid slug skipped");
      continue;
    }
    if (typeof name !== "string" || name.length === 0) {
      console.warn(`HUB_FEEDBACK_SOURCES: empty name skipped (slug=${slug})`);
      continue;
    }
    if (typeof url !== "string" || !isSafePublicUrl(url)) {
      console.warn(`HUB_FEEDBACK_SOURCES: unsafe url skipped (slug=${slug})`);
      continue;
    }
    // kind 省略 = "feedback"。指定ありで未知値は skip (安全側、誤設定を黙って feedback 化しない)。
    let resolvedKind: FeedbackSourceKind = "feedback";
    if (kind !== undefined) {
      if (typeof kind !== "string" || !KIND_SET.has(kind as FeedbackSourceKind)) {
        console.warn(`HUB_FEEDBACK_SOURCES: unknown kind skipped (slug=${slug})`);
        continue;
      }
      resolvedKind = kind as FeedbackSourceKind;
    }
    out.push({ slug, name, url, kind: resolvedKind });
  }
  return out;
}

/**
 * registered services (優先) と env 由来 extra ソースを slug で dedup マージ。
 * slug 重複時は registered を残す (本登録された場合の二重 pull を回避)。
 */
export function mergeFeedbackSources(
  registered: FeedbackSource[],
  extra: FeedbackSource[],
): FeedbackSource[] {
  const seen = new Set(registered.map((s) => s.slug));
  const merged = [...registered];
  for (const s of extra) {
    if (seen.has(s.slug)) continue;
    seen.add(s.slug);
    merged.push(s);
  }
  return merged;
}

/** registered ServiceDescriptor を標準 feedback ソースに変換 (origin 派生 base を保持)。 */
export function registeredToSource(s: ServiceDescriptor): FeedbackSource {
  return {
    slug: s.slug,
    name: s.name,
    url: s.serviceInfo?.endpoint ?? s.url,
    kind: "feedback",
  };
}

/**
 * feedback pull 対象 = registered active services ∪ env HUB_FEEDBACK_SOURCES。
 * collect 配線 (api/admin/collect, api/cron/collect) の runFeedbackCollection.loadServices に渡す。
 */
export async function loadFeedbackTargets(
  loadRegistered: () => Promise<ServiceDescriptor[]>,
  env: Record<string, string | undefined> = {},
): Promise<FeedbackSource[]> {
  const registered = (await loadRegistered()).map(registeredToSource);
  return mergeFeedbackSources(registered, parseFeedbackSources(env));
}
