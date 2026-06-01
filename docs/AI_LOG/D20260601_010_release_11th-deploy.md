# D20260601_010 release: 11th deploy (fix C20260601-002 本番反映)

**実行日時**: 2026-06-01
**コマンド**: /flow:release (/flow:auto P4.7 Release gate)
**状態**: 完了
**live 化判定**: ① .env.production.local CLERK_SECRET_KEY=sk_live_* 検出 → live 化済 (test→live swap skip)
**Phase 1 FILL**: 不要 (env 完備、CLERK_PUBLISHABLE_KEY 差分は VITE_ 別名の false positive)
**Phase 2 smoke**: 課金経路なし (内部監視 HUB)。描画は E2E 15/15 green で担保、実機は post-deploy HTTPS に委譲
**Phase 3**: 11th deploy = fix C20260601-002 (multi-series 描画 + runner capturedAt) を本番反映、Class B 明示確認待ち

## Decisions

- id: D20260601-017
  command: /flow:release
  phase: Phase1.0 live 判定 + Phase1.1 不足検出
  question: live 化状態 + FILL 要否
  chosen: live 化済 (sk_live_*)、FILL 不要、deploy のみ残
  chosen_type: auto-recommended
  context: release-pre 監査 2 段クリア後。残作業 = fix の 11th deploy。deploy-prod.sh (sync-prod-env → vercel deploy --prod) 既存 10-deploy パイプライン使用。

- id: D20260601-018
  command: /flow:release
  phase: Phase3 deploy + §3.4 smoke
  question: 11th deploy (Class B) 実行 + post-deploy 検証
  chosen: deploy 実行承認 (ユーザー option 1) → dpl_CyaSBioXMcbq1AorspNYX6tG12jx READY
  chosen_type: explicit-choice
  context: Class B 明示確認後 agent が bash scripts/deploy-prod.sh 実行。smoke: / 200 / /api 401 (Clerk auth gate OK、単一 owner) / 非-500 (O51 関数起動) / favicon 200。

## 結果サマリ (確定)
- 状態: 完了
- 11th deploy = dpl_CyaSBioXMcbq1AorspNYX6tG12jx、aliased https://service-hub.givers.work
- post-deploy smoke 全 green
- live キー (sk_live_* / Clerk production) 稼働、スキーマ変更なし、revert 可
