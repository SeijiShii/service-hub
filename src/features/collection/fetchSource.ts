/**
 * feedback ソースの kind 別 fetch dispatcher (inquiries-reply-channel revise)。
 * runFeedbackCollection の fetchFeedback dep に渡す。
 * - kind=feedback: 標準 `/api/hub/feedback` (合成 ServiceDescriptor 経由で既存 fetchFeedback 再利用)。
 * - kind=inquiries: `/api/hub/inquiries` (email/adminUrl/subject を取り込む新 adapter)。
 */
import type { ServiceDescriptor } from "../../types/index.js";
import {
  fetchFeedback,
  type FeedbackFetchDeps,
  type FeedbackFetchResult,
} from "../../providers/feedback.js";
import { fetchInquiries } from "../../providers/inquiries.js";
import type { FeedbackSource } from "./feedbackSources.js";

export function fetchFromSource(
  src: FeedbackSource,
  deps: FeedbackFetchDeps = {},
): Promise<FeedbackFetchResult> {
  if (src.kind === "inquiries") return fetchInquiries(src, deps);
  // feedback: 既存 adapter を合成 ServiceDescriptor 経由で再利用 (origin は url から派生)。
  const desc: ServiceDescriptor = {
    slug: src.slug,
    name: src.name,
    url: src.url,
    status: "active",
    providers: {},
  };
  return fetchFeedback(desc, deps);
}
