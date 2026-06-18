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
import { fetchFeedback } from "../../src/providers/feedback.js";
import {
  runCollection,
  runFeedbackCollection,
} from "../../src/features/collection/index.js";
import { checkCronSecret } from "../../src/features/collection/index.js";
import { evaluate, notify } from "../../src/features/alerts/index.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  if (!checkCronSecret(typeof auth === "string" ? auth : undefined)) {
    return res.status(401).json({ error: "forbidden" });
  }
  const db = createDb();
  const run = await runCollection({
    loadServices: () => loadServices(db, { onlyActive: true }),
    getAdapters: (s) => getAdapters(s, { env: process.env }),
    saveSnapshots: (rows) => upsertSnapshots(db, rows),
    saveRun: (r) => recordRun(db, r),
    // favicon-projection: service-info adapter からの iconUrl を services テーブルへ永続化
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
      // 通知チャネルは [論点-AL1]。MVP: 画面内(openAlerts)のみ。Webhook は release で env から。
      await notify(
        {
          channel: async () => {},
          markNotified: (id) => markAlertNotified(db, id),
        },
        fired,
      );
    },
  });
  // feedback 収集 ([論点-007]/O67、spec-review R1): metrics 収集とは別 orchestration。
  // 失敗しても metrics run のレスポンスは返す (feedback は補助、独自サマリで可視化)。
  let feedback;
  try {
    feedback = await runFeedbackCollection({
      loadServices: () => loadServices(db, { onlyActive: true }),
      fetchFeedback: (s) => fetchFeedback(s, { env: process.env }),
      saveFeedback: (rows) => upsertFeedbackItems(db, rows),
    });
  } catch (e) {
    feedback = {
      servicesCount: 0,
      itemsPulled: 0,
      errors: [
        { serviceSlug: "*", message: e instanceof Error ? e.message : "error" },
      ],
    };
  }
  return res.status(200).json({ ...run, feedback });
}
