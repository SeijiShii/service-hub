/** Clerk セッションの最小表現 (実 SDK 非依存、テスト可能)。 */
export interface AuthState {
  userId: string | null;
}

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** 許可ユーザー (seiji) か判定。allowedId 未設定はフェイルクローズ (誰も通さない)。 */
export function isAllowedUser(
  userId: string | null | undefined,
  allowedId: string | undefined = process.env.ALLOWED_USER_ID,
): boolean {
  return !!userId && !!allowedId && userId === allowedId;
}

/** 未認証=401 / 非seiji=403 を投げる。成功時 {userId}。 */
export function requireSeiji(
  auth: AuthState | null | undefined,
  allowedId: string | undefined = process.env.ALLOWED_USER_ID,
): { userId: string } {
  if (!auth || !auth.userId) throw new AuthError(401, "unauthenticated");
  if (!isAllowedUser(auth.userId, allowedId))
    throw new AuthError(403, "forbidden");
  return { userId: auth.userId };
}

/** ユーザーゲート対象外パス (cron は Cron secret で別途保護)。 */
export function isPublicCronPath(path: string): boolean {
  return /^\/api\/cron\//.test(path);
}

/**
 * 公開ルート (ユーザーゲート対象外、認証不要)。`/api/public/*` のみ。
 * 全ルート fail-close の唯一の意図的例外 (cron と同列)。公開するのは安全サブセットのみ
 * (public-status-api、buildPublicStatus が投影)。新ルートを安易にここへ足さないこと。
 */
export function isPublicPath(path: string): boolean {
  return /^\/api\/public\//.test(path);
}
