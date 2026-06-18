import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import { createDb, listFeedback } from "../../src/db/index.js";
import { loadServices } from "../../src/registry/index.js";
import {
  parseFeedbackFilter,
  buildInboxVM,
} from "../../src/features/feedback-inbox/index.js";
import {
  requireSeiji,
  AuthError,
  getAuthFromRequest,
} from "../../src/auth/index.js";

/**
 * GET /api/feedback/inbox — 運営者フィードバックインボックス ([論点-007]/O67)。
 * requireSeiji (Clerk 単一ユーザー) で保護。service/kind/period フィルタ付き一覧 + サービス名解決。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireSeiji(await getAuthFromRequest(req.headers));
  } catch (e) {
    return res
      .status(e instanceof AuthError ? e.status : 500)
      .json({ error: "unauthorized" });
  }
  const db = createDb();
  const services = await loadServices(db, { onlyActive: true });
  const filter = parseFeedbackFilter(req.query, Date.now());
  const rows = await listFeedback(db, filter);
  return res.status(200).json(buildInboxVM(rows, services));
}
