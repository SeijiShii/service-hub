# service-detail 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（Phase3 反復9）/ **状態**: コア完了（GREEN）

## 実装ファイル（src/features/service-detail/）
| ファイル | 内容 |
|---|---|
| detail.ts | buildServiceDetail: descriptor + timeseries → メトリクス別 series VM、service なし→null(404) |
| MetricChart.tsx | Recharts 折れ線(accent 色, mono 軸, 固定寸法でテスト容易)、空→EmptyState |
| ServiceDetailView.tsx | メタ(StatusDot/slug/URL)+チャート群+アラート履歴、null→404 |

## 設計反映
- DB timeseries のみ（provider 直叩きなし）。design-system: accent 折れ線 + mono 軸。
- 404(不明 slug)/空 series(EmptyState) ハンドリング。

## 保留（bootstrap）: ルーティング(dashboard → /services/:slug)、db loader 接続。

## 検証
- `npm run test`: 86 passed（service-detail 8 + 既存 78）/ `npm run typecheck`: green / errors 0。
