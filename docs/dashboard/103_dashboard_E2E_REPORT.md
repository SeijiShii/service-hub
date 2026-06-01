# dashboard E2E 実行レポート (103)

**実行日**: 2026-05-26 / **コマンド**: /flow:e2e（/flow:auto P4.5 E2E gate）/ **FW**: Playwright (cached Chromium) / **結果**: ✅ green

## 実行方式
- `vite build` → `vite preview`(4173) に対し headless Chromium で実行 (Class A、no-key)。
- API は Playwright route-mock で fixture VM を返す (実キー不要)。Clerk は key 無し時 bare 描画 (認可本体は API)。

## シナリオ結果
| ID | 内容 | 結果 |
|---|---|---|
| UC1-S1 | 横断サマリ "2 up · 1 down" + kakei 行 data-status=down + 142 表示 | ✅ |
| UC1-S2 | データなし → EmptyState | ✅ |
| UC1-S5 | run failed → AlertBanner | ✅ |
| UC1-S4 | /services/:slug 遷移で詳細表示 | ✅ |

## 視覚検証 (O34 L1)
- `dashboard-happy.png` baseline 生成・regression green。

## 追記: fix C20260601-002 (multi-series 描画崩れ) — 2026-06-01
- **コマンド**: /flow:e2e dashboard（/flow:auto P4.5 相当、fix 検証）/ **結果**: ✅ green (dashboard 7/7, full 15/15)
- 追加シナリオ:
  | ID | 内容 | 結果 |
  |---|---|---|
  | FX-E2E-01 | 2 service 同一 run (ms 差 capturedAt) の上部チャートが `data-series-count=2` + 分バケット整列で `data-points=2` (4 分裂せず) | ✅ |
- **視覚 baseline 更新** (ユーザー承認済、x 軸の意図した変更): `dashboard-happy.png` / `detail-happy.png` を更新。diff は x 軸 tick ラベルのみ (旧: 生 ISO カテゴリ軸 → 新: epoch time scale, `M/D HH:mm` 分整形)。ライン・y 軸・採算チャート・レイアウトは不変。旧 baseline はバグの ISO 軸を撮影したもの。
- service-detail (単一 series) も同 MetricChart 共通化のため x 軸更新、`data-points=3` 維持で後方互換 OK。
