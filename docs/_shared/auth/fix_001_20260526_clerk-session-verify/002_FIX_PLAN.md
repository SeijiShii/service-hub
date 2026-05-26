# 修正計画: Clerk セッションのサーバ側検証を実装

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`
> **最終更新**: 2026-05-26

## 1. 修正対象ファイル
| ファイル | 修正内容 | before | after |
|---|---|---|---|
| `package.json` | `@clerk/backend` 依存追加 | — | `"@clerk/backend": "^3"` |
| `src/auth/server.ts` | `getAuthFromRequest` を async 化し `__session` cookie を `verifyToken` で検証。注入 seam で testable。**クライアント供給ヘッダは信頼しない** | `headers["x-clerk-user-id"]` を読むだけ | cookie の JWT を検証→`sub`=userId |
| `api/dashboard/summary.ts` | `await getAuthFromRequest(req.headers)` | 同期呼び | await |
| `api/services/[slug]/timeseries.ts` | 同上 | 同期呼び | await |
| `src/auth/server.test.ts` | 新規。検証 seam の単体テスト | — | 追加 |

設計（採用案 B）:
```ts
// src/auth/server.ts
import { verifyToken } from "@clerk/backend";
import type { AuthState } from "./guard.js";

export type VerifyFn = (token: string) => Promise<{ sub?: string }>;
const defaultVerify: VerifyFn = (token) =>
  verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });

/** cookie ヘッダから __session (Clerk セッション JWT) を取り出す。 */
export function readSessionToken(headers): string | null { /* cookie パース */ }

/** Clerk セッションを検証して userId を得る。失敗時 null（フェイルクローズ）。 */
export async function getAuthFromRequest(headers, verify: VerifyFn = defaultVerify): Promise<AuthState> {
  const token = readSessionToken(headers);
  if (!token) return { userId: null };
  try { const { sub } = await verify(token); return { userId: sub ?? null }; }
  catch { return { userId: null }; }
}
```

## 2. 修正範囲の限定方針
根本原因（サーバ検証欠落）のみを修正。`requireSeiji`/`isAllowedUser`（純ロジック、テスト済）は変更しない。cron（`CRON_SECRET`）系統は別系統で無変更。**旧 `x-clerk-user-id` ヘッダ路は撤去**（偽装リスク）。

## 3. 副作用なき確認方法
- 既存 `guard.test.ts` 全 green を維持（変更しないため当然）。
- 新 `server.test.ts`: token 無し→null / verify 成功→userId / verify 失敗→null / cookie パース。
- 結合: handler が未認証で 401、検証成功で 200 を返すことを mock verify で確認。
- `npm run typecheck` / `vitest run` / `vite build` 全 green。

## 4. リリース戦略
通常リリース（`/flow:release` 再開でデプロイ判断に戻す）。本番未到達のため hotfix 不要。

## 5. ロールバック方針
- コード revert で完全に戻せる: ✅（git tracked）。
- DB 影響なし。

## 6. DoD
- [ ] cookie 検証で seiji が 200 を得られる（mock + 実 Clerk JWKS）
- [ ] token 無し/不正で 401
- [ ] クライアント供給 `x-clerk-user-id` は無視される（偽装不可）
- [ ] 003 REGRESSION_TEST 全 green / 既存テスト破壊なし / typecheck・build green
