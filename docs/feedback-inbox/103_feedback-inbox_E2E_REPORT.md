# E2E テストレポート: feedback-inbox

- 状態: **E2E green**
- FW: Playwright (route-mock、Clerk bare build)　実行コマンド: `npx playwright test feedback-inbox`　対象 URL: ローカル preview (http://localhost:4173)
- last_updated: 2026-06-18

## journey 別結果
| journey (004 由来) | spec | 結果 | 備考 |
|---|---|---|---|
| UC1-S1 横断一覧 + kind バッジ + L2-1 降順 | e2e/feedback-inbox.spec.ts | ✅ pass | visual baseline `feedback-inbox-list.png` (time mask) |
| UC1-S4 空状態 | 同 | ✅ pass | visual baseline `feedback-inbox-empty.png` |
| UC1-S3 kind フィルタ絞り込み (refetch) | 同 | ✅ pass | select 変更で 3→1 件 |

- 4 passed / 0 failed / 0 flaky (revise inbox-ux で restyle → baseline 更新 + RE-UC1-S1 件数サマリ + UC1-S3 を kind segmented chips 操作に更新)
- 旧: 3 passed (初回 baseline)。revise inbox-ux (2026-06-18) で UI 変更 (件数サマリ + token 絞り込みバー + kind chips) → visual baseline 再生成 + spec 更新、4 specs green。

## flaky / quarantine
- なし

## 検出した実装バグ (fix seed)
- なし

## カバレッジ補足
- UC1-S2 (service フィルタ) / UC1-S5 (未認証リダイレクト) は E2E では route-mock bare build のため割愛。S2 はフィルタ機構が S3 と同一実装で View unit (FI-V3) がカバー、S5 は認可ゲート unit api テスト (401 paths) がカバー。
- Level 1 visual regression (snapshot 2 枚) + Level 2 意味的アサーション (L2-1 降順、フィルタ上配置は View unit L2-3) を採用 (004 §5.4)。Level 3 AI Vision は内部ツールのため不採用。

## metrics
metrics: { e2e_specs: 3, pass: 3, fail: 0, flaky: 0, framework: "playwright", target: "local-preview" }
