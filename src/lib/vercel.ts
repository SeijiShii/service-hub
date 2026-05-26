/** Vercel Function の最小型 (実行時は Vercel が互換オブジェクトを供給。@vercel/node 依存を避ける)。 */
export interface VercelRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
export interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}
