# 単体テスト計画（public-status-api）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 auth/dashboard テスト
> **最終更新**: 2026-05-27

## 1. 追加テストケース

### 1.1 buildPublicStatus 純ロジック（Phase 1）
| ID | 入力 | 期待 |
|---|---|---|
| PS-N1 | active サービス + 最新 up=1 | `{slug,name,url,status:"up",lastCheckedAt}` |
| PS-N2 | up=0 | `status:"down"` |
| PS-N3 | up スナップショット無し | `status:"unknown"` |
| PS-N4 | status=paused/retired のサービス | 出力に含まれない（active のみ） |
| PS-S1 (セキュリティ・最重要) | snapshots に revenue_month_usd/ai_cost_month_usd/mau/raw_json 等を含めても | 出力 JSON に**それらのキーが一切出ない**（`JSON.stringify` に内部キー名が含まれないと assert） |
| PS-B1 | active 0 件 | `[]` |

### 1.2 guard.isPublicPath（Phase 2）
| ID | 入力 | 期待 |
|---|---|---|
| PS-G1 | `/api/public/status` | true（ゲート対象外） |
| PS-G2 | `/api/dashboard/summary` | false（gate 対象） |
| PS-G3 | `/api/public/` 前置の任意 | true |

### 1.3 公開ハンドラ結合（Phase 2）
| ID | 入力 | 期待 |
|---|---|---|
| PS-H1 | 無認証 GET（cookie 無し） | **200**（requireSeiji を通さない）+ `PublicServiceStatus[]` |
| PS-H2 | レスポンス body | 内部指標キーを含まない（PS-S1 と整合） |
| PS-H3 | OPTIONS（preflight） | 204 + CORS ヘッダ |
| PS-H4 | レスポンスヘッダ | `Access-Control-Allow-Origin` + `Cache-Control: public, max-age=60` |

## 2. 修正テストケース
なし（既存 guard テストは不変。`requireSeiji`/`isPublicCronPath` は変更しない）。

## 3. 削除テストケース
なし。

## 4. リグレッション強化
- 既存 `guard.test.ts`（requireSeiji 401/403、isPublicCronPath）green 維持。
- 既存 gate 済 API（dashboard/summary・cost-sim/summary 等）の**無認証 401**が維持される（公開ルート追加で他が緩まないこと）。

## 5. Mock 方針差分
| 対象 | 方針 |
|---|---|
| snapshots / services | テスト用フィクスチャ注入（内部キー混入版も用意し PS-S1 で非漏洩を確認） |
| DB | ハンドラ結合は無認証 200 経路まで（PS-H1）。DB 到達は pglite or 注入で最小確認 |

## 6. カバレッジ目標
- `buildPublicStatus` / `isPublicPath` / ハンドラ: 新規行 90%+。**PS-S1（内部キー非漏洩）は必須**。

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成 | /flow:revise |
