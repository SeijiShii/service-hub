# 改修: ダッシュボード最終更新表示

- **issue / slug**: refresh-cadence / 15min-and-last-updated（**スコープ縮小**、下記参照）
- **実施日**: 2026-05-28
- **対象**: collection（../README.md）
- **改修要望**:
  - 当初: (1) 自動 pull を 24h → 15 分化、(2) ダッシュボードに「最終更新」表示。
  - **スコープ縮小 (2026-05-28)**: ユーザー方針「Vercel 経由・日次でよい・手動更新で補完する」により**(1) cron 移行を撤回**。Vercel Cron 日次のまま、頻度が要る時は別 revise `force-pull` の「今すぐ pull」ボタンで補完。本 revise は **(2) 最終更新表示のみ**を残す。
- **設計判断**: 最終更新は最新 `collection_runs.finishedAt` を JST + 相対時間で表示（既存 `recentRuns(db,1)` を VM に反映）。
- **状態**: 設計完了（縮小スコープ）→ 実装

## ドキュメント
- 001_REVISE_SPEC（縮小版）/ 002_REVISE_PLAN（Phase 1 のみ）/ 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- 101_REVISE_IMPL_REPORT / 102_REVISE_UNIT_TEST_REPORT（実装後）

## 関連
- 基準 SPEC: `../001_collection_SPEC.md`
- 手動補完: `../revise_force-pull_20260528_admin-button/`（force-pull ボタン）
- 撤回部分: cron 移行（GH Actions 15 分）— Vercel Cron 維持方針で不採用。[論点-002] 案 B も将来再検討時の選択肢として残存。
- 後続: `/flow:tdd collection refresh-cadence` で実装（dashboard VM/View のみ）
