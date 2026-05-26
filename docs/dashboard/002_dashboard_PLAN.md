# dashboard 実装計画書

> **入力**: `./001_dashboard_SPEC.md`, `../_shared/{db,auth}/`, `../registry/`, `../design/design-system.md`, `../concept.md` §1.4
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/features/dashboard/）
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/features/dashboard/DashboardPage.tsx` | `/` ページ（一覧 + ヘッダ + バナー） | components, db query | ~120 |
| `src/features/dashboard/ServiceRow.tsx` | 1 行（StatusDot/MetricCell/QuotaBar） | components | ~70 |
| `src/features/dashboard/summary.ts` | サーバー側データ取得（db 結合） | db, registry, auth | ~60 |
| `src/components/StatusDot.tsx` 他 | 共通 UI（design-system トークン） | tailwind theme | ~80 |
| `api/dashboard/summary.ts`（採用時） | API（RSC/loader でも可） | summary.ts, auth | ~25 |

## 2. 実装 Phase 分割（/flow:tdd）
### Phase 1: データ取得 summary.ts（mock db）
- 取得 + 結合（descriptor × latestMetrics × openAlerts）ロジック。db を注入 mock。
- テスト: 欠損メトリクス→`—`、down 判定、無料枠%算出（thresholds）。
### Phase 2: UI コンポーネント（design-system トークン）
- StatusDot/MetricCell/QuotaBar/ServiceRow/Header/EmptyState/AlertBanner。
- テスト: role/text ベース（status ラベル、メトリクス値、down 行の前景化）。
### Phase 3.5: app bootstrap（Vite + Tailwind theme + Clerk Provider 結線、O36/O37）
- design-system のトークンを Tailwind theme に反映（コックピット/dark）。lucide 導入。

## 3. 依存関係順序
db/registry/auth（済）→ summary.ts → 共通 components → ServiceRow → DashboardPage

## 4. 既存ファイルへの影響
- 共通 components（StatusDot 等）を新設 → service-detail/alerts も再利用。
- design-system トークンを Tailwind theme 化（初回）。

## 5. 横断フォルダへの追加・変更
共通 UI components を src/components/ に（service-detail と共有）。

## 6. リスク・注意点
- **provider 直叩き禁止**: DB のみ読む（性能 / レート）。
- **design-system 準拠**: 状態色+形状（色覚）、mono+tabular メトリクス、dark トークン。
- **視覚レビュー**: 画面実装後に `/flow:design --review-only`（Design gate P4.4(b)）。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、summary/コンポーネントの unit green
- [ ] DB のみで描画（provider 直叩きなし）
- [ ] design-system トークン適用
- [ ] E2E（004）green + 視覚レビュー green（Design gate）

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
