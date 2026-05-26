import type { VercelRequest, VercelResponse } from "../../../src/lib/vercel.js";
import { createDb, serviceSnapshots, openAlerts } from "../../../src/db/index.js";
import { loadServices } from "../../../src/registry/index.js";
import { buildServiceDetail } from "../../../src/features/service-detail/detail.js";
import { requireSeiji, AuthError, getAuthFromRequest } from "../../../src/auth/index.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireSeiji(getAuthFromRequest(req.headers));
  } catch (e) {
    return res.status(e instanceof AuthError ? e.status : 500).json({ error: "unauthorized" });
  }
  const slug = String(req.query.slug ?? "");
  const svc = loadServices().find((s) => s.slug === slug);
  if (!svc) return res.status(404).json(null);
  const db = createDb();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [rows, alerts] = await Promise.all([serviceSnapshots(db, slug, since), openAlerts(db)]);
  return res.status(200).json(buildServiceDetail(svc, rows, alerts));
}
