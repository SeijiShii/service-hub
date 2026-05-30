import { formatJst } from "./lastUpdatedFormat.js";

/**
 * last_deploy_at (epoch_ms) を一覧テーブル「最終デプロイ」カラム表示用に JST 整形 (last-deploy-col)。
 * - 有効値 → `YYYY-MM-DD HH:MM` (JST/UTC+9、サマータイムなし)。JST 整形は formatJst に一元化 (spec-review R4)。
 * - 未収集 (undefined/null) / NaN・Infinity / 0・負値 → `—`。
 *   0 ガードは投機的でなく必須: providers/adapters vercel が deploy timestamp 欠落時に value=0 を
 *   snapshot 化し得るため (spec-review R5、1970-01-01 誤表示防止)。
 * 決定的 (now 非依存): epoch_ms から純粋導出。
 */
export function formatDeployAt(
  epochMs: number | null | undefined,
): string {
  if (epochMs == null || !Number.isFinite(epochMs) || epochMs <= 0) return "—";
  return formatJst(new Date(epochMs));
}
