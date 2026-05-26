/** 外向き fetch の安全ラッパ ([論点-004]): タイムアウト / リダイレクト制限 / 内部アドレス抑止。 */
const INTERNAL_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|\[?fc00:|\[?fe80:)/i;

export function isInternalUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return INTERNAL_HOST.test(h) || h === "::1";
  } catch {
    return true; // パース不能は危険側に倒す
  }
}

export interface SafeFetchOpts {
  timeoutMs?: number;
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
  allowInternal?: boolean; // テスト用
}

export async function safeFetch(url: string, opts: SafeFetchOpts = {}): Promise<Response> {
  const { timeoutMs = 10_000, headers, fetchImpl = fetch, allowInternal = false } = opts;
  if (!allowInternal && isInternalUrl(url)) throw new Error("blocked: internal address");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { headers, redirect: "manual", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

const SECRET_KEY = /(token|secret|key|authorization|password|bearer)/i;

/** raw_json 保存前に秘密フィールドをスクラブ ([論点-004] / O25)。 */
export function scrubSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubSecrets);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEY.test(k) ? "[REDACTED]" : scrubSecrets(v);
    }
    return out;
  }
  return value;
}
