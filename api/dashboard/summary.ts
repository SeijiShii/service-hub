import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import {
  createDb,
  latestPerService,
  openAlerts,
  recentRuns,
  recentSnapshots,
} from "../../src/db/index.js";
import { DASHBOARD_CHART_METRICS } from "../../src/features/dashboard/summary.js";
import { loadServices } from "../../src/registry/index.js";
import { buildDashboard } from "../../src/features/dashboard/summary.js";
import {
  requireSeiji,
  AuthError,
  getAuthFromRequest,
} from "../../src/auth/index.js";

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
  // timeseries-topchart (spec-review R1): recentSnapshots を既存 Promise.all に並列追加
  // 過去 30 日 + 主要 3 metric (DASHBOARD_CHART_METRICS、last-deploy-col で 4→3) に絞って軽量化
  const sinceIso = new Date(Date.now() - 30 * 864e5).toISOString();
  const [latest, alerts, runs, chartSnaps] = await Promise.all([
    latestPerService(db),
    openAlerts(db),
    recentRuns(db, 1),
    recentSnapshots(db, sinceIso, [...DASHBOARD_CHART_METRICS]),
  ]);
  return res
    .status(200)
    .json(buildDashboard(services, latest, alerts, runs[0], chartSnaps));
}
