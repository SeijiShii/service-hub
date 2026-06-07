import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import {
  createDb,
  latestPerService,
  openAlerts,
  recentRuns,
  recentSnapshots,
} from "../../src/db/index.js";
import { DASHBOARD_CHART_SOURCE_METRICS } from "../../src/features/dashboard/summary.js";
import {
  parsePeriod,
  periodToSinceIso,
} from "../../src/features/dashboard/chartPeriod.js";
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
  // chart-ux: 期間セレクタ (?period=all|30d|7d、既定/不正は 30d) で chart 取得 since を切替。
  // chart source metric (mau/revenue_total_yen) に絞って軽量化。all は epoch0 起点 (全期間)。
  const period = parsePeriod(
    Array.isArray(req.query.period) ? req.query.period[0] : req.query.period,
  );
  const sinceIso = periodToSinceIso(period, Date.now());
  const [latest, alerts, runs, chartSnaps] = await Promise.all([
    latestPerService(db),
    openAlerts(db),
    recentRuns(db, 1),
    recentSnapshots(db, sinceIso, [...DASHBOARD_CHART_SOURCE_METRICS]),
  ]);
  return res
    .status(200)
    .json(buildDashboard(services, latest, alerts, runs[0], chartSnaps));
}
