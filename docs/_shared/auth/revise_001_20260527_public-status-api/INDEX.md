# 改修 #001 ドキュメントインデックス — public-status-api

**issue / slug**: 001 / public-status-api
**実施日**: 2026-05-27
**状態**: 設計完了（SPEC + PLAN + UNIT_TEST + E2E_TEST）

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 |
|---|---|---|
| 001 | [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) | 変更仕様 |
| 002 | [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) | 変更計画 |
| 003 | [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) | 単体テスト計画 |
| 004 | [004_REVISE_E2E_TEST.md](./004_REVISE_E2E_TEST.md) | E2E テスト計画 |

## 改修サマリ
`GET /api/public/status`（無認証・公開）を追加。auth の「全ルート gate」への唯一の公開例外。
公開安全サブセット `PublicServiceStatus[] = {slug,name,url,status,lastCheckedAt}` のみ投影
（内部の 収益/コスト/採算/離脱率/利用数/トークン は構造的に出さない）。別サービスの公開ショーケースが消費。

## 主要設計判断
- 安全サブセット投影 `buildPublicStatus`（純ロジック、内部キー非含有をテスト）
- 認可カーブアウト `isPublicPath`（`/api/public/*`、cron と同列の唯一例外）
- CORS `*`（公開安全データ、[論点-PS1] で showcase origin 制限の余地）/ Cache-Control 60s
- 完全後方互換（additive、DB 変更なし）

## 契約（公開ショーケースが参照）
`PublicServiceStatus = { slug, name, url, status: "up"|"down"|"unknown", lastCheckedAt? }`

## 関連
- 親機能 INDEX: `../INDEX.md` / 基準 SPEC: `../001_auth_SPEC.md`
- AI_LOG: `../../../AI_LOG/D20260527_003_revise__shared_auth_public-status-api.md`
- 消費側: 公開ショーケースサービス（別 repo）

<!-- auto-generated-end -->
