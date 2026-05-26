# dashboard 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（Phase3 反復8）/ **状態**: コア完了（GREEN）

## 実装ファイル
| ファイル | 内容 |
|---|---|
| src/features/dashboard/summary.ts | buildDashboard: registry×snapshots×openAlerts→行VM + up/down カウント + 無料枠%(warn/over) |
| src/features/dashboard/rowStatus.ts | rowStatusKind: 行の総合状態を 1 StatusKind に集約 |
| src/features/dashboard/ServiceRow.tsx | 1 行(StatusDot/mono メトリクス右揃え/data-status) |
| src/features/dashboard/DashboardView.tsx | ヘッダ(N up·M down)+AlertBanner+EmptyState+テーブル |
| src/components/StatusDot.tsx | 状態色+形状(色覚非依存)+aria-label |
| src/components/tokens.ts | コックピット/dark 状態色 + 形状記号(design-system) |

## 設計反映
- **DB のみ読む**前提（summary は db クエリ結果を入力に取る純関数、provider 直叩きなし）。
- design-system 準拠: 状態色 + **形状記号でも区別**（色覚配慮）、mono メトリクス右揃え、dark トークン。
- 欠損は `—`、down 行/run failed で AlertBanner、空で EmptyState。

## 保留（Phase 3.5 bootstrap）
- Vite app entry / ルーティング / ClerkProvider 結線 / Tailwind theme(トークン CSS 変数) / db データ loader と DashboardView の接続。React テスト基盤(happy-dom)導入済。

## 検証
- `npm run test`: 78 passed（dashboard 9 + 既存 69）/ `npm run typecheck`: green / vitest errors: 0。
- React テスト env = happy-dom（jsdom の CSS-calc ESM 問題回避）。
