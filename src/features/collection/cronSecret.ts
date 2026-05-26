/** Vercel Cron の Authorization ヘッダ照合 (Clerk ゲート外、collection 専用)。 */
export function checkCronSecret(
  authHeader: string | null | undefined,
  expected: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!expected) return false; // フェイルクローズ
  return authHeader === `Bearer ${expected}`;
}
