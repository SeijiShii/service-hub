/**
 * 公開安全 URL 判定 (SSRF 予防 SoT、spec-review R3 / P19 違反回避)。
 * registry/schema.ts publicUrl と adapters.ts iconUrl format check の共通モジュール。
 *
 * 判定条件:
 * - 文字列 + 空でない
 * - URL パース成功
 * - protocol = https のみ (http/data/javascript/ftp 等は拒否)
 * - hostname が internal でない (localhost / 127. / 10. / 192.168. / 169.254. / 172.16-31. / 0.0.0.0)
 * - 全長が maxLength 以内 (default 1024)
 *
 * silent reject 設計: 失敗時に throw せず boolean 返却。呼び出し側で stderr 警告ログ等の運用可視性を確保 (P80)。
 */

const INTERNAL_HOST =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|172\.(1[6-9]|2\d|3[01])\.)/i;

export interface SafeUrlOpts {
  /** 最大文字数 (default 1024) */
  maxLength?: number;
}

export function isSafePublicUrl(value: unknown, opts: SafeUrlOpts = {}): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  const maxLength = opts.maxLength ?? 1024;
  if (value.length > maxLength) return false;
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (!u.hostname) return false;
  if (INTERNAL_HOST.test(u.hostname)) return false;
  return true;
}
