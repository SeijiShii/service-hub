import type { AuthState } from "./guard.js";
/**
 * Vercel Function から Clerk セッションを取り出す。
 * MVP: ヘッダ経由のプレースホルダ。実 Clerk backend 検証 (@clerk/backend authenticateRequest)
 * は release/bootstrap 完了時に差し替える ([論点-AUTH-SERVER])。
 */
export function getAuthFromRequest(headers: Record<string, string | string[] | undefined>): AuthState {
  const uid = headers["x-clerk-user-id"];
  return { userId: typeof uid === "string" ? uid : null };
}
