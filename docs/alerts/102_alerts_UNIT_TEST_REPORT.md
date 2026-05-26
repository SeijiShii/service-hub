# alerts 単体テストレポート (102)

**実行日**: 2026-05-26 / **FW**: Vitest（注入 mock）/ **結果**: ✅ 9 passed

| ケース | 結果 |
|---|---|
| AL-N1 down 発火 | ✅ |
| AL-N3 free_tier_over | ✅ |
| AL-N2/B2 80% 境界 free_tier_80pct | ✅ |
| AL-E1 重複抑制(open あり再発火なし) | ✅ |
| AL-E2 回復 resolve | ✅ |
| AL-B1 thresholds 未設定→down のみ | ✅ |
| AL-N4 notify 送信+markNotified | ✅ |
| AL-E3 送信失敗→markNotified せず | ✅ |
| notifiedAt あり→スキップ | ✅ |
