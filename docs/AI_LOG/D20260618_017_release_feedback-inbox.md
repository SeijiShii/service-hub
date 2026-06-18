# D20260618_017_release_feedback-inbox — /flow:release (feedback-inbox prod 反映)

**実行日時**: 2026-06-18
**コマンド**: /flow:release
**対象**: service-hub (feedback-inbox [論点-007] 本番反映)
**実行者**: seiji (auto via /flow:auto D20260618_008)
**状態**: 完了 (18th deploy green)

metrics: { deploy_target: production, deploy_seq: 18, deployed_url: "https://service-hub.givers.work", deploy_id: "dpl_7rAUwePWVhy3jdw99BfBtTRa3dqj", smoke: "frontend 200 / public-status 200 / feedback-inbox 401(authed) / dashboard 401", db_push: "feedback_items applied", blocker_fixed: ".vercelignore (test files → function count 14→8)" }

## サマリ

§1.0 live 判定 = **live 化済** (Clerk production + sk_live_* 稼働中、17th deploy)。test→live swap 不要。
新 env なし (HUB_SERVICE_INFO_SECRET 既設定)、ドメイン (service-hub.givers.work) + favicon 設定済。
残作業 = feedback-inbox 機能の prod 反映 = (1) db:push `feedback_items` テーブル + (2) redeploy (Class B)。
§1.0c: fleet model 既定 prod-direct (DB スキーマ追加 = data 系のため「preview を挟むなら --dev-first」recommend は添えるが block しない)。

## Decisions

- id: D20260618-017-00
  command: /flow:release
  phase: §1.0 / §3.3
  question: feedback-inbox prod 反映 (db:push + redeploy) の Class B 承認
  chosen: YES (本番直行) → 18th deploy 成功
  chosen_type: explicit-choice
  context: |
    live 化済 PJ の改修デプロイ。release-pre full audit C0/H0 (5683498) + secure SEC 0 (bdd51f0) 通過済。
    additive migration (feedback_items 新規テーブル、既存非破壊) + 全 390 tests green + E2E 3 green + 視覚 green。
    Class B (本番 Neon スキーマ変更 + redeploy) のため §3.3 ハードゲートで明示承認を要求 → ユーザー「YES」。

- id: D20260618-017-01
  command: /flow:release
  phase: §3.4 デプロイ実行 + blocker 修正
  question: 18th deploy 実行
  chosen: db:push 適用 → 初回 deploy が Hobby 12 関数超過で fail → .vercelignore 修正 → 再 deploy 成功
  chosen_type: auto-recommended
  context: |
    手順: git push (6a44954) → db-push-prod.sh ([✓] Changes applied、feedback_items 本番 Neon 追加) →
    deploy-prod.sh 初回 = deploy_failed "No more than 12 Serverless Functions" (CF-20260529-015)。
    根本原因: vercel.json functions glob `api/**/*.ts` が colocated test (api/**/*.test.ts) も関数化 →
    8 実 + 6 test = 14 > 12 (feedback-inbox 追加で超過、従来は 7+5=12 ぎりぎり)。.vercelignore 新設で
    test/spec/e2e を deploy 除外 → 8 関数に → 再 deploy 成功 (dpl_7rAUwePWVhy3jdw99BfBtTRa3dqj、READY)。
    post-deploy smoke: frontend 200 / public-status 200 / feedback-inbox 401(authed gate=O22/O51) /
    dashboard 401(回帰なし)。feedback-inbox consumer 本番 LIVE。

- id: D20260618-017-02
  command: /flow:release
  phase: §4 #5 promote 判定
  chosen: promote 不発火 (concept §4.7 = 内部・非公開)
  chosen_type: auto-recommended
  context: service-hub は seiji 専用内部ダッシュボード (非公開)。告知 (promote) 対象外。
