# _shared/auth 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（Phase3 反復4）/ **状態**: コア完了（GREEN）、glue は bootstrap 保留

## 実装ファイル（src/auth/）
| ファイル | 内容 | 状態 |
|---|---|---|
| guard.ts | requireSeiji(401/403)/isAllowedUser(フェイルクローズ)/isPublicCronPath/AuthError | ✅ 実装+テスト |

## 設計反映
- 単一ユーザー: ALLOWED_USER_ID と Clerk userId 照合（二重防御の app 側）。allowedId 未設定=フェイルクローズ(403)。
- cron は isPublicCronPath で除外（Cron secret で別途保護、collection 側）。

## 保留（Phase 3.5 bootstrap、要 Clerk/React install）
- `middleware.ts`（Clerk middleware で全ルート保護）/ `provider.tsx`（ClerkProvider ラップ）= 実 SDK 結線。dashboard 実装時の app bootstrap でまとめて配線（O35: コアは注入でテスト済、glue は最終）。

## 検証
- `npm run test`: 44 passed（auth 7 + 既存 37）/ `npm run typecheck`: green。
