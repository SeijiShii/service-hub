import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import {
  createDb,
  upsertSnapshots,
  recordRun,
  recordAlert,
  resolveAlert,
  markAlertNotified,
  openAlerts,
  updateServiceMeta,
  upsertFeedbackItems,
} from "../../src/db/index.js";
import { loadServices } from "../../src/registry/index.js";
import { getAdapters } from "../../src/providers/index.js";
import {
  runCollection,
  runFeedbackCollection,
  loadFeedbackTargets,
  fetchFromSource,
} from "../../src/features/collection/index.js";
import { evaluate, notify } from "../../src/features/alerts/index.js";
import {
  requireSeiji,
  AuthError,
  getAuthFromRequest,
} from "../../src/auth/index.js";

/**
 * admin force-pull (D20260528-019)。`/api/cron/collect` (Vercel Cron 専用、CRON_SECRET) と並列の
 * Clerk ゲート内 trigger。seiji が `/admin` 「今すぐ pull」ボタンから即時収集を起動する。
 * deps 構築は cron 版と同形 (runner 再利用) で auth だけ requireSeiji。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireSeiji(await getAuthFromRequest(req.headers));
  } catch (e) {
    return res
      .status(e instanceof AuthError ? e.status : 500)
      .json({ error: "unauthorized" });
  }

  if ((req.method ?? "GET") !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const db = createDb();
    const run = await runCollection({
      loadServices: () => loadServices(db, { onlyActive: true }),
      getAdapters: (s) => getAdapters(s, { env: process.env }),
      saveSnapshots: (rows) => upsertSnapshots(db, rows),
      saveRun: (r) => recordRun(db, r),
      // favicon-projection: service-info adapter からの iconUrl を services.icon_url へ永続化
      // (cron 版 api/cron/collect.ts と対称、本配線漏れが「今すぐ pull で iconUrl が DB 更新されない」原因だった、2026-05-28 hot-fix)
      updateServiceMeta: (slug, meta) => updateServiceMeta(db, slug, meta),
      onCollected: async (rows, services) => {
        const fired = await evaluate(
          {
            getOpenAlerts: () => openAlerts(db),
            recordAlert: (e) => recordAlert(db, e),
            resolveAlert: (id) => resolveAlert(db, id),
          },
          rows,
          services,
        );
        await notify(
          {
            channel: async () => {},
            markNotified: (id) => markAlertNotified(db, id),
          },
          fired,
        );
      },
    });
    // feedback も手動 pull で取り込む (cron 版 api/cron/collect.ts と対称、claim C20260618-001)。
    // これが無いと「今すぐ pull」で metrics だけ更新され feedback は日次 cron 待ちになり、
    // shipyard 等 producer の動作確認が即できない。失敗しても metrics run は返す (feedback は補助)。
    let feedback;
    try {
      feedback = await runFeedbackCollection({
        // registered active services ∪ 無登録 env ソース (HUB_FEEDBACK_SOURCES、shipyard 等)。
        loadServices: () =>
          loadFeedbackTargets(
            () => loadServices(db, { onlyActive: true }),
            process.env,
          ),
        fetchFeedback: (s) => fetchFromSource(s, { env: process.env }),
        saveFeedback: (rows) => upsertFeedbackItems(db, rows),
      });
    } catch (e) {
      feedback = {
        servicesCount: 0,
        itemsPulled: 0,
        errors: [
          {
            serviceSlug: "*",
            message: e instanceof Error ? e.message : "error",
          },
        ],
      };
    }
    return res.status(200).json({ ...run, feedback });
  } catch (e) {
    // 詳細は stderr のみ (admin/services と同パターン、漏洩防止)。
    console.error("admin/collect error:", e);
    return res.status(500).json({ error: "internal" });
  }
}
