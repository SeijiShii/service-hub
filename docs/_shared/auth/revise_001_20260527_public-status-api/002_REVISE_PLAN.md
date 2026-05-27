# 変更計画書（public-status-api）

> **入力**: `./001_REVISE_SPEC.md`, 既存 src (auth/db/registry/dashboard summary)
> **最終更新**: 2026-05-27

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク | SPEC § |
|---|---|---|---|
| `src/auth/guard.ts` | `isPublicPath(path)`（`/api/public/` 前置一致）を追加。`isPublicCronPath` と同列の「ゲート対象外」allowlist | 低（追加関数） | §3/§7.5 |
| `src/auth/index.ts` | re-export（自動） | なし | — |
| `docs/_shared/auth/001_auth_SPEC.md` / `README.md` | 「公開ルートは `/api/public/*` と cron のみ、他は例外なく gate」を明記 | 低（文書） | §7.5 |
| `vercel.json` | `rewrites` が `/api/` を除外済みか確認のみ（現状 `/((?!api/).*)` で除外済 → 変更不要の見込み） | 低 | §3 |

## 2. 新規ファイル一覧
| ファイル | 責務 | LOC |
|---|---|---|
| `src/features/public-status/buildPublicStatus.ts` | 純ロジック: registry active + 最新 up → `PublicServiceStatus[]`（安全サブセットのみ、内部フィールド非含有） | ~40 |
| `src/features/public-status/buildPublicStatus.test.ts` | テスト: up/down/unknown 判定、active 限定、**内部キー非含有 assert** | ~50 |
| `src/features/public-status/index.ts` | re-export + `PublicServiceStatus` 型（or types に置く） | ~3 |
| `api/public/status.ts` | 公開ハンドラ: requireSeiji 不使用、GET/OPTIONS、CORS `*`、Cache-Control、buildPublicStatus を返す | ~30 |
| `api/public/status.test.ts` | 結合: 無認証で 200 + 安全サブセット / OPTIONS 204 / レスポンスに内部キーが無い | ~35 |
| (types) `src/types/public.ts` | `PublicServiceStatus` 公開 DTO（or buildPublicStatus 隣接） | ~8 |

## 3. 削除ファイル一覧
なし。

## 4. マイグレーション要否
- DB スキーマ変更: ❌ / 既存データ変換: ❌ / 設定: ❌（CORS=`*` 既定、env 制限は将来 [論点-PS1]）
→ **005 MIGRATION 不要**。

## 5. 実装 Phase 分割（/flow:tdd 連携）
- **Phase 1（投影ロジック）**: `PublicServiceStatus` 型 + `buildPublicStatus` 純ロジック + テスト（**内部キー非含有 assert を含む**）。RED→GREEN→IMPROVE。
- **Phase 2（公開ハンドラ）**: `guard.isPublicPath` + `api/public/status.ts`（CORS/Cache/GET/OPTIONS）+ 結合テスト（無認証 200 / 内部キー非含有 / OPTIONS 204）。
- **Phase 3（文書）**: auth SPEC/README に公開カーブアウト明記。

## 6. 依存関係順序
types(`PublicServiceStatus`) → buildPublicStatus(純ロジック) → guard.isPublicPath → api/public/status → 文書。

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| 1 | 投影ロジック | unit（内部キー非含有） |
| 2 | 公開ハンドラ | 結合（無認証 200 / 安全サブセット） |
| 3 | デプロイ後 | `curl https://<hub>/api/public/status` が 200 + 安全 JSON（認証不要で叩ける唯一のルート） |
> additive・フラグ不要。

## 8. リスク・注意点
- **最大リスク = 財務漏洩**: dashboard の full VM や snapshot 全体を誤って返さない。`buildPublicStatus` は明示 DTO のみ構築し、テストで内部キー（`revenue_month_usd`/`ai_cost_month_usd`/`mau`/`raw_json` 等）が JSON に出ないことを assert。
- 新 API ルートを将来追加する際、`/api/public/` 以外は gate 維持（fail-close）。
- vercel.json rewrite が公開ルートを SPA に飲まないこと（`/api/` 除外を確認）。

## 9. 完了の定義 (DoD)
- [ ] 無認証で `GET /api/public/status` が 200 + `PublicServiceStatus[]`
- [ ] レスポンスに内部指標キーが**一切含まれない**（テストで保証）
- [ ] gate 済ルートは不変（既存 auth テスト green）
- [ ] CORS/Cache ヘッダ付与 / OPTIONS 204
- [ ] typecheck + build + 全テスト green
- [ ] auth SPEC/README に公開カーブアウト明記

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成 | /flow:revise |
