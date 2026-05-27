import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import {
  createDb,
  latestPerService,
  openAlerts,
  recentRuns,
} from "../../src/db/index.js";
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
  const [latest, alerts, runs] = await Promise.all([
    latestPerService(db),
    openAlerts(db),
    recentRuns(db, 1),
  ]);
  return res
    .status(200)
    .json(buildDashboard(services, latest, alerts, runs[0]));
}
