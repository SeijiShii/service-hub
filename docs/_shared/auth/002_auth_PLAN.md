# _shared/auth 実装計画書

> **入力**: `./001_auth_SPEC.md`, `../../concept.md` §3.X / §4.7
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/auth/）
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/auth/middleware.ts` | 全ルート保護（Clerk middleware）+ 非 seiji 拒否 | Clerk SDK | ~40 |
| `src/auth/guard.ts` | requireSeiji / isAllowedUser（API 用ガード） | Clerk SDK | ~35 |
| `src/auth/provider.tsx` | Clerk Provider ラップ（フロント） | Clerk SDK | ~20 |
| `src/auth/index.ts` | バレル | 上記 | ~5 |

## 2. 実装 Phase 分割（/flow:tdd、O35 injectable）
### Phase 1: ガードロジック（mock Clerk）
- 対象: guard.ts（isAllowedUser/requireSeiji）。Clerk クライアントを注入（interface）、mock で未認証/非seiji/seiji を再現。
- テスト: 未認証→401、非seiji→403、seiji→通過。
### Phase 2: middleware + provider 配線
- 対象: middleware.ts, provider.tsx。実 Clerk SDK は Phase 3.5（app bootstrap）で結線、実 key は release。

## 3. 依存関係順序
guard.ts → middleware.ts / provider.tsx → index.ts

## 4. 既存ファイルへの影響
なし（新規）。env に `ALLOWED_USER_ID`/`CLERK_*` 追加（.env.example 更新）。

## 5. 横断フォルダへの追加・変更
全 feature ルート + API がガード適用。cron は別経路（collection）。

## 6. リスク・注意点
- **フェイルクローズ**: Clerk エラー時は拒否（内部ツール、安全側）。
- **cron 経路の除外**: `/api/cron/*` はユーザーゲートでなく Vercel Cron secret で保護（collection）。混同しない。
- **二重防御**: Clerk allowlist + アプリ側 ALLOWED_USER_ID 照合。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、guard の unit green（401/403/通過）
- [ ] 全ルートが保護される（middleware matcher が cron 以外を網羅）
- [ ] E2E: 対象外（cross-cutting、ログインフローは feature の E2E でカバー）

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
