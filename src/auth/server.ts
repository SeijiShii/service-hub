import { verifyToken } from "@clerk/backend";
import type { AuthState } from "./guard.js";

type Headers = Record<string, string | string[] | undefined>;

/** Clerk セッション JWT を検証して payload を返す (失敗時 throw)。注入可能 (テスト用)。 */
export type VerifyFn = (token: string) => Promise<{ sub?: string }>;

const defaultVerify: VerifyFn = (token) =>
  verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Cookie ヘッダから Clerk セッション JWT (`__session`) を取り出す。
 * 配列/未設定/空値は null (フェイルクローズ)。
 */
export function readSessionToken(headers: Headers): string | null {
  const raw = headers["cookie"];
  if (typeof raw !== "string") return null;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === "__session") {
      const token = v.join("=");
      return token ? token : null;
    }
  }
  return null;
}

/**
 * Vercel Function から Clerk セッションを検証して userId を取り出す。
 * フロントは `credentials: "include"` で `__session` cookie を送る。これをサーバ側で
 * @clerk/backend verifyToken で検証する。検証できない場合は null (フェイルクローズ)。
 * クライアント供給ヘッダ (x-clerk-user-id 等) は一切信頼しない (偽装防止)。
 */
export async function getAuthFromRequest(
  headers: Headers,
  verify: VerifyFn = defaultVerify,
): Promise<AuthState> {
  const token = readSessionToken(headers);
  if (!token) return { userId: null };
  try {
    const { sub } = await verify(token);
    return { userId: sub ?? null };
  } catch {
    return { userId: null };
  }
}
