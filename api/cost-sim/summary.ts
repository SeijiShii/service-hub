import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import { createDb, latestPerService } from "../../src/db/index.js";
import {
  loadPricing,
  buildServiceUsages,
  runCostSim,
  isStale,
} from "../../src/features/cost-sim/index.js";
import { requireSeiji, AuthError, getAuthFromRequest } from "../../src/auth/index.js";

/** 採算 + 無料枠コストシミュレーション集約 (business-observability Phase D)。 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireSeiji(await getAuthFromRequest(req.headers));
  } catch (e) {
    return res.status(e instanceof AuthError ? e.status : 500).json({ error: "unauthorized" });
  }
  const db = createDb();
  const pricing = loadPricing();
  const latest = await latestPerService(db);
  const usages = buildServiceUsages(latest);
  const accounts = runCostSim(usages, pricing);
  return res.status(200).json({
    accounts,
    pricingUpdated: pricing.updated,
    stale: isStale(pricing, new Date(), 30),
  });
}
