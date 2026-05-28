# _shared/types E2E テスト計画（favicon-projection）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.1 UC, 既存 `../../auth/revise_001_20260527_public-status-api/004_REVISE_E2E_TEST.md`
> **最終更新**: 2026-05-28

---

## 1. 変更 UC シナリオ

### UC: PS-UC1 拡張 (公開 API レスポンスに iconUrl optional)
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| FP-E2E-01 | DB に services 1 件 (slug='hana-memo', icon_url='https://hana-memo.givers.work/favicon.svg', active) + usage_snapshots (up=1) | `GET /api/public/status` | 200 + 配列 1 件 + `iconUrl: 'https://hana-memo.givers.work/favicon.svg'` 含む |
| FP-E2E-02 | DB に services 1 件 (icon_url=NULL、active) + up=1 | `GET /api/public/status` | 200 + 配列 1 件 + iconUrl キー含有しない (undefined) |
| FP-E2E-03 | DB に services 2 件 (1 件 iconUrl 有 / 1 件 NULL) | `GET /api/public/status` | 200 + 配列 2 件 + 各要素で iconUrl 状態が正しく投影 |
| FP-E2E-04 | DB に services 1 件 (icon_url='https://...', active) + up メトリクス無し (status=unknown) | `GET /api/public/status` | 200 + 配列 1 件 + `status:'unknown'` + iconUrl 含む (status と iconUrl は独立) |
| FP-E2E-05 | DB に services 1 件 (paused、iconUrl 有) | `GET /api/public/status` | 200 + 配列空 (paused は除外、active only) |

### UC: SI-UC1+2 (cron collect → iconUrl 永続化、producer 模擬 mock)
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| FP-E2E-10 | producer mock が v2 contract で `iconUrl:'https://svc.example/favicon.svg'` 返す + services に対象 slug 有 (icon_url=NULL) | cron collect 実行 (`POST /api/cron/collect` with CRON_SECRET) | 200 + DB `services.icon_url` が 'https://svc.example/favicon.svg' に更新 |
| FP-E2E-11 | producer mock が v1 contract (iconUrl 無し) 返す | cron collect 実行 | 200 + DB `services.icon_url` は変更なし (NULL or 既存値保持) |
| FP-E2E-12 | producer mock が v2 contract で iconUrl='http://...' (http 不正) 返す | cron collect 実行 | 200 + DB `services.icon_url` は変更なし (format check fail で無視) |
| FP-E2E-13 | producer mock が v2 contract で iconUrl 内部アドレス返す | cron collect 実行 | 200 + DB `services.icon_url` は変更なし (SSRF 予防) |
| FP-E2E-14 | producer mock が v2 → v1 → v2 の順で 3 回 cron collect 走る (中間で iconUrl 落とす) | cron collect 3 回実行 | 1 回目: 設定 → 2 回目: 保持 (no-op) → 3 回目: 再上書き |

### UC: admin 経路で iconUrl 設定不可 (SoT 一貫性、API レベル)
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| FP-E2E-20 | Clerk セッション有 (seiji) | `PATCH /api/admin/services/<slug>` で body に `{iconUrl: 'https://hijacker.example/icon.png'}` 送信 | 200 or 400 (実装次第)、ただし **DB `services.icon_url` は更新されない** (admin 経路では iconUrl を受け付けない) |
| FP-E2E-21 | Clerk セッション有 (seiji) | `POST /api/admin/services` で新規登録 body に iconUrl 含む | 同上、iconUrl は無視 (NULL でレコード作成) |

## 2. リグレッションシナリオ（既存 UC、重要度高）

| UC | シナリオ ID | 確認観点 |
|---|---|---|
| 既存 PS-UC1 (公開 API 安全サブセット) | FP-RG-01 | 公開 API レスポンスに **revenue/ai_cost/profit/mau/raw_json/thresholds/providers/secretEnv/token** が引き続き含まれないこと (iconUrl 追加で誤って財務情報まで露出していないか) |
| 既存 PS-UC2 (CORS) | FP-RG-02 | `OPTIONS /api/public/status` → 204 + `Access-Control-Allow-Origin: *`、変更なし |
| 既存 collection cron (ping + vercel + neon) | FP-RG-03 | 既存 adapter (ping/vercel/neon) が iconUrl 関連変更で壊れていないこと (metrics 抽出が green) |
| 既存 dashboard (内部 API) | FP-RG-04 | dashboard `/api/dashboard/*` レスポンスが iconUrl 追加で破壊されていないこと (内部用なので iconUrl 含んでも問題ないが、shape の互換性確認) |
| 既存 service-detail (internal) | FP-RG-05 | service-detail page が iconUrl 追加で表示崩れしていないこと (今回 admin UI で iconUrl 設定 UI は追加しないため UI 変更なし、表示確認のみ) |
| 既存 v1 producer (bousai-bag-checker 現状) | FP-RG-06 | 既存 v1 producer (schemaVersion=1) からの service-info 受信が引き続き parse 成功し、metrics が正常収集されること (後方互換) |

## 3. 移行検証シナリオ

| シナリオ ID | 移行前データ | 移行後期待状態 |
|---|---|---|
| FP-MIG-01 | migration 適用前: services 3 行 (icon_url カラム無し) | migration 適用後: services 3 行 (icon_url=NULL、それ以外のカラム値は完全保持) |
| FP-MIG-02 | migration 適用後の cron collect 1 回実行 | producer 申告ある service は icon_url 更新、無い service は NULL のまま |
| FP-MIG-03 | rollback migration 適用 | services 3 行 (icon_url カラム削除、それ以外のカラム値は完全保持)、`/api/public/status` レスポンスから iconUrl キー消失 |

## 4. 環境要件差分

| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| DB schema | 既存 services テーブル (icon_url 無し) | + icon_url text nullable | 本 revise の追加 |
| migration runner | drizzle-kit migrate (既存) | 変更なし、新 migration ファイル 1 本追加 | scripts/with-env.sh drizzle-kit migrate で適用 |
| producer mock | metrics のみ返す mock | + iconUrl 含む / 含まない / format invalid の variant | 上記シナリオに対応 |
| Vercel deploy | 既存 production env | 変更なし (env 追加なし) | iconUrl は DB に保存、env 設定不要 |

## 5. 期待 KPI

| 指標 | 目標 |
|---|---|
| FP-E2E-01〜21 全成功 | 100% green |
| FP-RG-01〜06 リグレッション全成功 | 100% green |
| FP-MIG-01〜03 migration 検証成功 | 100% green |
| 公開 API レスポンスタイム | 既存 NFR (< 500ms p95) 維持 (iconUrl 1 列追加で劣化なし想定) |

## 6. 更新履歴

| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (FP-E2E-01〜21 + FP-RG-01〜06 + FP-MIG-01〜03) | /flow:revise |
