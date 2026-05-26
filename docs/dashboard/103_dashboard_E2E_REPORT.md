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
