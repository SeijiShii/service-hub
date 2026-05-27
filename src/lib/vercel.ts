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
  /** ヘッダ設定 (CORS / Cache-Control 等)。実行時は Vercel が供給。 */
  setHeader(name: string, value: string): VercelResponse;
  /** ボディ無しレスポンス終端 (OPTIONS 204 等)。 */
  end(): VercelResponse;
}
