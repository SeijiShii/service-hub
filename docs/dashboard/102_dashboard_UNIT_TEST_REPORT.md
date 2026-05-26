# dashboard 単体テストレポート (102)

**実行日**: 2026-05-26 / **FW**: Vitest + @testing-library/react + happy-dom / **結果**: ✅ 9 passed

| ケース | 結果 |
|---|---|
| DA-N1/N4 結合 + up/down カウント | ✅ |
| DA-N2 無料枠 warn/over | ✅ |
| DA-E3 メトリクス欠損 up=null | ✅ |
| openAlertCount 集計 | ✅ |
| DA-B1 0 service | ✅ |
| rowStatusKind 集約 (down/warn/up/unknown) | ✅ |
| DashboardView: ヘッダ/行/data-status (render) | ✅ |
| DA-E1 EmptyState | ✅ |
| DA-E2 AlertBanner | ✅ |

備考: 視覚 L1/L2 (スクショ/computed-style) は E2E(/flow:e2e, Playwright)。本 unit は role/text/data-status。
