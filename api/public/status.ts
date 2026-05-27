import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import { createDb, latestPerService } from "../../src/db/index.js";
import { loadServices } from "../../src/registry/index.js";
import { buildPublicStatus } from "../../src/features/public-status/index.js";

/**
 * 公開ステータス API (public-status-api)。認証なし・公開 (全ルート gate の唯一の例外)。
 * 公開安全サブセットのみ返す (buildPublicStatus)。別サービスの公開ショーケースが消費。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS: 公開安全データのため全許可 ([論点-PS1]。showcase ドメイン確定後に env で制限可)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=60");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }
  try {
    const db = createDb();
    const services = loadServices({ onlyActive: true });
    const latest = await latestPerService(db);
    return res.status(200).json(buildPublicStatus(services, latest));
  } catch (e) {
    // 運用追跡用に stderr へログ (Vercel logs で確認可)。client には詳細を出さない (漏洩防止)。
    console.error("public/status error:", e);
    return res.status(500).json({ error: "unavailable" });
  }
}
