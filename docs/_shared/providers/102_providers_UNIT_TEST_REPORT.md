# _shared/providers 単体テストレポート (102)

**実行日**: 2026-05-26 / **FW**: Vitest 2.1（mock fetch 注入）/ **結果**: ✅ 16 passed（fetch 4 + adapters 12）

| 観点 | 結果 |
|---|---|
| PR-E5 SSRF 内部アドレス抑止 / safeFetch reject | ✅ |
| PR-B1 scrubSecrets（再帰 redact, O25） | ✅ |
| PR-N1/N2 ping up/down | ✅ |
| PR-N3 neon storage/compute 正規化 | ✅ |
| PR-N4 vercel last_deploy / PR-N5 clerk mau 代理 | ✅ |
| PR-N6 service-info 正規化 / PR-B2 未知 schemaVersion 後方互換 | ✅ |
| PR-E1/E2/E3 timeout/auth/rate_limited | ✅ |
| PR-N7 getAdapters 選択 + service-info 包含 | ✅ |

## 備考
- 実 API 疎通（実トークン）は /flow:release Phase2。本テストは公開ドキュメント基準の mock fixture。
