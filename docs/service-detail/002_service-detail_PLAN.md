# service-detail 実装計画書

> **入力**: `./001_service-detail_SPEC.md`, `../_shared/{db,auth}/`, `../design/design-system.md`
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/features/service-detail/）
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/features/service-detail/ServiceDetailPage.tsx` | `/services/:slug` ページ | components, Recharts, query | ~130 |
| `src/features/service-detail/MetricChart.tsx` | 時系列折れ線（Recharts、状態色） | Recharts, theme | ~80 |
| `src/features/service-detail/detail.ts` | サーバー側取得（timeseries 結合） | db, registry, auth | ~70 |
| `api/services/[slug]/timeseries.ts` | API（RSC/loader でも可） | detail.ts, auth | ~30 |

## 2. 実装 Phase 分割（/flow:tdd）
### Phase 1: detail.ts（mock db）
- timeseries 取得 + メタ結合 + 期間フィルタ。db 注入 mock。
- テスト: 期間フィルタ、複数メトリクスの series 構築、不明 slug→404、データなし→空 series。
### Phase 2: UI（MetricChart + Page）
- Recharts 折れ線（accent + 状態色、mono 軸）、QuotaBar、アラート履歴テーブル。
- テスト: role/text + チャートのデータ点数 / 系列名。
### Phase 3.5: ルーティング結線（dashboard からの遷移）

## 3. 依存関係順序
db/registry/auth（済）→ detail.ts → MetricChart → ServiceDetailPage

## 4. 既存ファイルへの影響
- 共通 components（dashboard で新設の StatusDot 等）を再利用。Recharts 新規導入。

## 5. 横断フォルダへの追加・変更
共通 components 再利用（dashboard と共有）。

## 6. リスク・注意点
- **provider 直叩き禁止**（DB timeseries のみ）。
- **複合 index 活用**（db の (service_slug,metric_key,captured_at) でクエリ）。
- **design-system 準拠**（チャート色 = accent + 状態色、mono 軸）。視覚レビュー対象。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、detail/チャートの unit green
- [ ] DB timeseries で描画
- [ ] E2E（004）green + 視覚レビュー green

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
