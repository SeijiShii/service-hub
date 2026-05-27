import type { VercelRequest, VercelResponse } from "../../src/lib/vercel.js";
import {
  createDb,
  listServices,
  getService,
  upsertService,
  setServiceStatus,
  deleteService,
} from "../../src/db/index.js";
import { validateServiceInput } from "../../src/registry/validate.js";
import {
  requireSeiji,
  AuthError,
  getAuthFromRequest,
} from "../../src/auth/index.js";

/**
 * レジストリ admin write (D20260528-001)。Clerk ゲート内・seiji のみ (公開例外にしない)。
 * GET=一覧 / POST=登録 / PATCH=編集 / DELETE=退役 (既定 retire、?hard=1 で物理削除)。
 * write は serviceDescriptorSchema で SSRF/秘密直書き/slug 形式を検証 + slug 一意性 (DB)。
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
  const method = req.method ?? "GET";
  const slug = String(req.query.slug ?? "");

  try {
    if (method === "GET") {
      return res.status(200).json(await listServices(db));
    }

    if (method === "POST") {
      const v = validateServiceInput(req.body);
      if (!v.ok)
        return res.status(400).json({ error: "validation", errors: v.errors });
      if (await getService(db, v.data.slug))
        return res.status(409).json({ error: "slug_exists" });
      await upsertService(db, v.data);
      return res.status(201).json(v.data);
    }

    if (method === "PATCH") {
      if (!slug || !(await getService(db, slug)))
        return res.status(404).json({ error: "not_found" });
      const v = validateServiceInput({ ...(req.body as object), slug });
      if (!v.ok)
        return res.status(400).json({ error: "validation", errors: v.errors });
      await upsertService(db, v.data);
      return res.status(200).json(v.data);
    }

    if (method === "DELETE") {
      if (!slug || !(await getService(db, slug)))
        return res.status(404).json({ error: "not_found" });
      if (req.query.hard === "1") await deleteService(db, slug);
      else await setServiceStatus(db, slug, "retired");
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    // 詳細は stderr のみ (漏洩防止)。
    console.error("admin/services error:", e);
    return res.status(500).json({ error: "internal" });
  }
}
