# D20260618_012_e2e_feedback-inbox — /flow:e2e feedback-inbox

**実行日時**: 2026-06-18
**コマンド**: /flow:e2e
**対象**: feedback-inbox
**実行者**: seiji (auto via /flow:auto D20260618_008)
**状態**: 完了 (E2E green)

## サマリ

004 計画の UC1 journey を Playwright route-mock (Clerk bare build) で実装・実行。3 spec green、
flaky なし。初回 baseline (list/empty) 作成 → クリーン再実行で安定確認。

## Decisions

- id: D20260618-012-00
  command: /flow:e2e
  phase: Step 1-5
  question: E2E FW 検出 + journey 実装 + baseline
  chosen: Playwright route-mock (既存 e2e/ 規約踏襲)、3 spec green、初回 baseline 作成
  chosen_type: auto-recommended
  context: |
    playwright.config.ts (testDir e2e/、bare Clerk build で route-mock) を検出。service-detail.spec
    と同パターンで /api/feedback/inbox を route mock し /feedback を検証。
    UC1-S1 (一覧+kind バッジ+L2-1 降順+visual snapshot) / UC1-S4 (空状態+snapshot) /
    UC1-S3 (kind フィルタ refetch)。初回 baseline は新規 spec の初期作成 (既存 baseline の上書きでない
    = 隠れ回帰なし) のため auto-pick で --update-snapshots、その後クリーン run で 3/3 安定 green 確認。
    UC1-S5 (未認証) は bare build で gate 無効のため E2E 対象外、unit api テスト (401 paths) でカバー済。
