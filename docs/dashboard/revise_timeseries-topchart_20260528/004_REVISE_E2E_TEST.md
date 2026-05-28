# dashboard E2E テスト計画 (timeseries-topchart)

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.1, 既存 `../../004_dashboard_E2E_TEST.md`
> **最終更新**: 2026-05-28

---

## 1. 変更 UC シナリオ

### UC DA-UC1+4 拡張 (dashboard 二部構成表示)

| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| TS-E2E-01 | admin Clerk セッション、production DB に hana-memo 30 日分 snapshots | `/` (dashboard) を開く | 上部 = 4 chart 表示 (up / mau / db_storage_bytes / last_deploy_at) + 下部 = ServiceRow テーブル表示 |
| TS-E2E-02 | 同上、上部 chart 内 | mau chart の data-testid を locator | hana-memo の line 1 本描画、Legend に「hana-memo」表示、line stroke が `--chart-series-0` 相当 |
| TS-E2E-03 | snapshots がまだ集まっていない新 service (例: 連動 PJ 完了直後の新規 producer) | / を開く | 該当 service の line は不在、既存 service は line あり (混在表示) |
| TS-E2E-04 | snapshots 完全に空 (cron 未実行 / pull) | / を開く | 4 chart 全てに「データなし」表示、下部テーブルも「empty-state」表示 |
| TS-E2E-05 | service 数 1 件 (hana-memo) で `last_deploy_at` chart | last_deploy_at 軸表示確認 | Y 軸ラベルが「Mon DD」形式 (epoch_ms 値そのまま表示しない、可読性確保) |

### UC PS-UC1 (公開 API、不変確認)

| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| TS-E2E-10 | 本回改修後の本番 | `curl /api/public/status` | 既存 PublicServiceStatus shape (slug/name/url/status/lastCheckedAt/iconUrl) 維持、**charts プロパティ含まない** (shipyard 影響なし、SoT 一貫性) |

## 2. リグレッションシナリオ (既存 UC、重要度高)

| UC | シナリオ ID | 確認観点 |
|---|---|---|
| 既存 DA-UC1 (rows 表示) | TS-RG-01 | 下部 ServiceRow テーブルが本回改修で破壊されていないこと (slug/name/status/MAU/採算/離脱率/errors/alerts の全列表示維持) |
| 既存 DA-UC2 (admin link) | TS-RG-02 | header の `/admin` link が表示・動作維持 |
| 既存 DA-UC3 (force-pull) | TS-RG-03 | force-pull section 表示 + ボタン動作 + 結果表示維持 |
| 既存「empty-state」表示 | TS-RG-04 | rows=[] 時の「まだ収集データがありません」表示維持 (chart section と並存) |
| 既存 alert-banner | TS-RG-05 | downCount > 0 or lastRunStatus=failed 時の alert-banner 表示維持 |
| 既存 service-detail page (MetricChart 共通化後) | TS-RG-06 | `/services/<slug>` の MetricChart 表示が新 import path で動作維持、リグレッション 0 |
| 既存 admin/services CRUD | TS-RG-07 | admin form の編集→更新動作維持 (admin-form fix 反映済) |
| 既存 favicon-projection (内部 dashboard iconUrl 表示) | TS-RG-08 | ServiceRow に iconUrl 表示 (de8bdfa) が本回 chart section 追加で破壊されないこと |
| shipyard public API (iconUrl 投影) | TS-RG-09 | `/api/public/status` レスポンス shape 維持 + iconUrl 含有維持 (本回 charts は内部 API のみ追加、public API 不変) |

## 3. 移行検証シナリオ

| シナリオ ID | 移行前データ | 移行後期待状態 |
|---|---|---|
| (なし) | DB schema 変更なし、既存 usage_snapshots 流用のため移行検証不要 | - |

## 4. 環境要件差分

| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| DB | services + usage_snapshots (icon_url + 既存全) | 変更なし | DB schema 変更なし |
| recharts | 3.8.1 (既導入) | 同上 | 新 library 不要 |
| Vercel function | 既存 | response size +α (charts: 1-50KB 程度) | 軽量、network 影響なし |
| 30 日分 snapshots seed (テスト用) | (service-detail テストで 1 service) | 全 active service × 主要 4 metric × 30 日分 seed helper | summary テスト + e2e テスト両方で使用 |

## 5. 期待 KPI

| 指標 | 目標 |
|---|---|
| TS-E2E-01〜10 全成功 | 100% green |
| TS-RG-01〜09 リグレッション全成功 | 100% green (リグレッション 0) |
| dashboard load (TTI) | < 2s (chart 追加で大きな劣化なし、recharts は SVG 描画軽量) |
| `/api/dashboard/summary` response | 200 OK + charts 含有、size < 100KB (service 数 < 20 想定) |
| 公開 API `/api/public/status` 不変 | shape 完全維持 (TS-E2E-10 で assert) |

## 6. 更新履歴

| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (TS-E2E-01〜10 + TS-RG-01〜09、二部構成 + shipyard 不変 assert) | /flow:revise |
