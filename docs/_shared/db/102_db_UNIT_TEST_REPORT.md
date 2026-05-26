# _shared/db 単体テストレポート (102)

**実行日**: 2026-05-26 / **FW**: Vitest 2.1 + pglite / **結果**: ✅ 8 passed（db）

| ケース | 結果 |
|---|---|
| DB-N1 insert | ✅ |
| DB-N2/B2 冪等 upsert（excluded で更新） | ✅ |
| DB-B1 空配列 no-op | ✅ |
| DB-N3 latestPerService（distinctOn 最新） | ✅ |
| DB-N4 timeseries（since 昇順） | ✅ |
| DB-E2/B3 データなし/未来 since → [] | ✅ |
| DB-N5 openAlerts（未解決のみ） | ✅ |
| DB-N6 recentRuns（新しい順 limit） | ✅ |

## 備考
- 実 Postgres は pglite（in-memory WASM）で代替、Docker/ネット不要で CI 再現可能。
- 本番 Neon 接続（client.ts）の疎通は /flow:release Phase2 で確認。
