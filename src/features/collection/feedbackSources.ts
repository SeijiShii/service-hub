/**
 * 無登録 feedback ソース ([論点-FI inbox-pull-source]、claim C20260618-001 §5 supersede)。
 *
 * `services` レジストリに登録しなくても、env `HUB_FEEDBACK_SOURCES` で定義した外部ソース
 * (shipyard 等) を feedback pull 対象に加える。各ソースは合成 ServiceDescriptor に変換され、
 * providers/feedback.ts の fetchFeedback がそのまま `${origin}/api/hub/feedback` を pull する。
 *
 * 設計判断 (AI_LOG D20260619-004):
 * - DB 登録不要・dashboard 監視対象外 (runFeedbackCollection のみに合流、runCollection には混ぜない)。
 * - secret は既存 HUB_SERVICE_INFO_SECRET を共用 (fetchFeedback が付与)。
 * - url は isSafePublicUrl で SSRF 予防 (registry publicUrl と同 SoT)、slug は registry と同正規表現。
 * - 不正 JSON 全体 → []、不正エントリ単体 → skip + warn (1 件で全体を止めない)。
 */
import type { ServiceDescriptor } from "../../types/index.js";
import { isSafePublicUrl } from "../../lib/safeUrl.js";

/** registry schema.ts serviceDescriptorSchema と同じ slug 制約。 */
const SLUG_RE = /^[a-z0-9-]+$/;

/** env `HUB_FEEDBACK_SOURCES` (JSON `[{slug,name,url}]`) を合成 ServiceDescriptor[] に parse。 */
export function parseFeedbackSources(
  env: Record<string, string | undefined> = {},
): ServiceDescriptor[] {
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

  const out: ServiceDescriptor[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      console.warn("HUB_FEEDBACK_SOURCES: non-object entry skipped");
      continue;
    }
    const e = entry as Record<string, unknown>;
    const { slug, name, url } = e;
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
    out.push({ slug, name, url, status: "active", providers: {} });
  }
  return out;
}

/**
 * registered services (優先) と env 由来 extra ソースを slug で dedup マージ。
 * slug 重複時は registered を残す (本登録された場合の二重 pull を回避)。
 */
export function mergeFeedbackSources(
  registered: ServiceDescriptor[],
  extra: ServiceDescriptor[],
): ServiceDescriptor[] {
  const seen = new Set(registered.map((s) => s.slug));
  const merged = [...registered];
  for (const s of extra) {
    if (seen.has(s.slug)) continue;
    seen.add(s.slug);
    merged.push(s);
  }
  return merged;
}

/**
 * feedback pull 対象 = registered active services ∪ env HUB_FEEDBACK_SOURCES。
 * collect 配線 (api/admin/collect, api/cron/collect) の runFeedbackCollection.loadServices に渡す。
 */
export async function loadFeedbackTargets(
  loadRegistered: () => Promise<ServiceDescriptor[]>,
  env: Record<string, string | undefined> = {},
): Promise<ServiceDescriptor[]> {
  const registered = await loadRegistered();
  return mergeFeedbackSources(registered, parseFeedbackSources(env));
}
