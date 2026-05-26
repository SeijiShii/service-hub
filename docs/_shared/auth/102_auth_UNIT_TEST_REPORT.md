# _shared/auth 単体テストレポート (102)

**実行日**: 2026-05-26 / **FW**: Vitest / **結果**: ✅ 7 passed

| ケース | 結果 |
|---|---|
| AU-N1 seiji 通過 | ✅ |
| AU-E1 未認証 401 | ✅ |
| AU-E2 非 seiji 403 | ✅ |
| AU-B1/E3 allowedId 未設定→フェイルクローズ 403 | ✅ |
| AU-N2 isAllowedUser 一致/不一致 | ✅ |
| AU-B2 cron パス除外 | ✅ |

備考: 実 Clerk ログインフローは feature E2E / release Phase2。middleware/provider glue は bootstrap。
