# collection 単体テストレポート (102)

**実行日**: 2026-05-26 / **FW**: Vitest（注入 mock）/ **結果**: ✅ 8 passed

| ケース | 結果 |
|---|---|
| CO-N1 全成功 ok + saveSnapshots(4 行) | ✅ |
| CO-E1 一部 error → partial + errors | ✅ |
| CO-E2 全 error → failed | ✅ |
| CO-E3 db 失敗 → failed + run 記録 | ✅ |
| CO-B1 0 active → ok count 0 | ✅ |
| onCollected(alerts hook) 呼び出し | ✅ |
| CO-N3/E4 cron secret 一致/不一致/未設定 | ✅ |
