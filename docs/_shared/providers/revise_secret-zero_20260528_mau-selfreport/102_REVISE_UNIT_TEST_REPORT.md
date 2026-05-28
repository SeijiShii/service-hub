# 単体テストレポート: _shared/providers 秘密ゼロ化

## 実施日時
2026-05-28 (JST)

## テスト実行環境
- vitest 2.1.9（node / happy-dom）

## テスト結果（本 revise 関連）
| # | テストケース | ファイル | 結果 |
|---|------------|---------|------|
| PV-N4 | service-info metrics の mau をそのまま emit | src/providers/adapters.test.ts | ✓ |
| PV-N1/N2 | 共通鍵あり→Bearer / なし→ヘッダなし | src/providers/adapters.test.ts | ✓ |
| PR-N6/B2 | service-info status+metrics 正規化 / unknown schemaVersion graceful | src/providers/adapters.test.ts | ✓ |
| T-N | ServiceDescriptor は識別子のみ・secretEnv なし | src/types/types.test.ts | ✓ |
| U-12 | 識別子(projectId)に秘密直書き → 拒否 | src/registry/validate.test.ts | ✓ |
| U-07〜U-13b | validate 既存ケース（secretEnv 撤去後も SSRF/slug/必須は維持） | src/registry/validate.test.ts | ✓ |

## 修正テストケース
- adapters.test: clerk adapter テスト削除（D-01）、describe を "vercel (PR-N4)" に。service-info に共通鍵 + mau passthrough を追加。
- types.test: secretEnv を含む例を撤去、appId 参照に変更。
- validate.test: U-12 を clerk.secretEnv → vercel.projectId の秘密直書きに変更。

## 削除テストケース
- createClerkAdapter の "clerk mau proxy from total_count"（adapter 撤去）。

## サマリー
| 項目 | 値 |
|------|-----|
| 全スイート合計 | 177 |
| 成功 | 177 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | exit 0 |
| 差分（前回 176→177） | clerk テスト −1 / service-info テスト +2 = 純 +1 |
