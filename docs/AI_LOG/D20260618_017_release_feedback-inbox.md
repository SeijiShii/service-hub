# D20260618_017_release_feedback-inbox — /flow:release (feedback-inbox prod 反映)

**実行日時**: 2026-06-18
**コマンド**: /flow:release
**対象**: service-hub (feedback-inbox [論点-007] 本番反映)
**実行者**: seiji (auto via /flow:auto D20260618_008)
**状態**: 進行中 (Class B デプロイ承認待ち)

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
  chosen: (ユーザー承認待ち)
  chosen_type: open
  context: |
    live 化済 PJ の改修デプロイ。release-pre full audit C0/H0 (5683498) + secure SEC 0 (bdd51f0) 通過済。
    additive migration (feedback_items 新規テーブル、既存非破壊) + 全 390 tests green + E2E 3 green + 視覚 green。
    Class B (本番 Neon スキーマ変更 + redeploy) のため §3.3 ハードゲートで明示承認を要求 (--auto-class-b でも省略不可)。
