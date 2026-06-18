# D20260618_007_release_summary-projection — /flow:release (summary prod 反映)

**状態**: 完了 (17th deploy green)
**開始**: 2026-06-18
**dispatch元**: /flow:auto (D20260618_002, P4.7 Release gate)
**metrics**: { deploy_target: production, deployed_url: "https://service-hub.givers.work", deployment_id: "dpl_4bUadnQGfUGwoPHxpaajQjkxLnZT", check_result: "public-status 200 + frontend 200", paid_confirmed: "N/A (課金経路なし)", collected_vars: 0 }

## 完了記録 (Class B 承認後実行)

- ユーザー承認「YES」→ ① `bash scripts/db-push-prod.sh` で本番 Neon に services.summary 列追加 ([✓] Changes applied) → ② `bash scripts/deploy-prod.sh` で 17th deploy (dpl_4bUadnQGfUGwoPHxpaajQjkxLnZT、READY、aliased givers.work)。
- post-deploy smoke: /api/public/status HTTP 200 (safe-subset 構造正常、summary は producer 未申告のため未出現=正常)、frontend HTTP 200。
- [論点-006] 完全 closed (code + prod 反映)。P4.7 Release gate ✅ 通過。

## サマリ

summary-projection [論点-006] (commit 8e97a26) の prod 反映。live 化済 PJ の改修デプロイ
(microservice fleet model → prod-direct)。残 = db:push services.summary (additive nullable) +
17th deploy。release-pre 2段クリア済。Class B deploy はユーザー承認待ちで pause。

## Decisions

- id: D20260618-007-01
  command: /flow:release
  phase: §1.0 live 判定 + Class A prep
  question: live 状態 / migration 安全性 / 残作業
  chosen: live化済 (sk_live_*) / additive nullable summary 列 = 安全 / 残=db:push+17th deploy (Class B)
  chosen_type: auto-recommended
  context: |
    §1.0 SoT順①: .env.production.local CLERK_SECRET_KEY=sk_live_* → live化済、test→live swap skip。
    migration: summary=text("summary") nullable = additive/後方互換/非破壊。低リスク。
    db:push prod 用に scripts/db-push-prod.sh を新設 (Class A、DATABASE_URL を .env.production.local
    から読み秘密マスク)。deploy = scripts/deploy-prod.sh (既存)。
    §1.0c microservice fleet model = prod-direct (preview 尋ねない)。
    §3.3 deploy 実行は Class B ハードゲート → ユーザー明示承認待ちで 1-decision pause。

## 次アクション (Class B、ユーザー承認待ち)
- ① bash scripts/db-push-prod.sh (本番 Neon に services.summary 列追加)
- ② bash scripts/deploy-prod.sh (17th deploy)
