# 単体テストレポート: collection force-pull

## 実施日時
2026-05-28 12:21 (JST)

## テスト実行環境
- vitest 2.1.9 (happy-dom + @testing-library/react)
- backend: `vi.hoisted` で auth/runCollection をモック、runCalls + runImpl 差し替えで分岐検証
- frontend: vi.fn() callback 呼び出し回数 + DOM 検証

## テスト結果

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| FP-E1 | 未認証 POST → 401 / runCollection 呼ばれない | api/admin/collect.test.ts | ✓ |
| FP-N1+N2 | 認証成功 POST → 200 + CollectionRun + runCollection 1 回 | api/admin/collect.test.ts | ✓ |
| FP-E2 | GET → 405 method_not_allowed | api/admin/collect.test.ts | ✓ |
| FP-E3 | runCollection が throw → 500 `{error:"internal"}` | api/admin/collect.test.ts | ✓ |
| FP-B1 | servicesCount=0 (空 registry) でも 200 | api/admin/collect.test.ts | ✓ |
| FP-N3 | 「今すぐ pull」ボタン click → onForcePull が 1 回 | ServicesAdminView.test.tsx | ✓ |
| FP-N4 | forcePullState.lastResult → サマリに servicesCount + errors 件数 | ServicesAdminView.test.tsx | ✓ |
| FP-E4 | running=true → ボタン disabled + 「実行中…」 + click 抑止 | ServicesAdminView.test.tsx | ✓ |
| 既存 | AF-1〜4 / UX-N3 / admin/services 全 9 件 | admin 配下 | ✓ (全保持) |

## 追加テストケース
- FP-N1〜B1: SPEC §7.2 入出力 (200/401/405/500) + §7.4 バリデーション
- FP-N3/N4/E4: SPEC §7.1 UC-FP1 (押下 → 実行中 disabled → サマリ表示)

## サマリー
| 項目 | 値 |
|---|---|
| 本 revise 関連の新規テスト | 8 (backend 5 + frontend 3) |
| 全スイート合計 | 194 |
| 成功 | 194 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | exit 0 |
| 既存テスト破壊 | なし (Props オプショナル化で後方互換) |
