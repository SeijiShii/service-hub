# service-detail 単体テストレポート (102)

**実行日**: 2026-05-26 / **FW**: Vitest + testing-library + happy-dom + Recharts / **結果**: ✅ 8 passed

| ケース | 結果 |
|---|---|
| SD-N1/N2 series 構築 | ✅ |
| SD-E1 service なし→null(404) | ✅ |
| SD-E2/B1 snapshot なし→series 空 | ✅ |
| 当該 service の alert のみ | ✅ |
| View: meta + チャート(data-points) | ✅ |
| View: null→404 / 空→EmptyState / アラート履歴 | ✅ |

備考: 視覚 L1/L2 は E2E(Playwright)。Recharts は固定寸法で happy-dom render。
