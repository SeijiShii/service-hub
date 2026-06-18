# D20260618_023_release_inbox-ux — /flow:release (revise inbox-ux 本番反映)

**実行日時**: 2026-06-18
**コマンド**: /flow:release
**対象**: service-hub (revise inbox-ux 統合一覧 + styling 本番反映)
**実行者**: seiji (auto via /flow:auto D20260618_019)
**状態**: 完了 (20th deploy green)

metrics: { deploy_target: production, deploy_seq: 20, deployed_url: "https://service-hub.givers.work", smoke: "frontend 200 / feedback-inbox 401 authed / public-status 200", change: "code-only (UI restyle + VM counts)、DB 変更なし" }

## サマリ

revise inbox-ux (件数サマリ + token 絞り込みバー + kind segmented chips) を本番反映。live PJ の
code-only redeploy (env/DB 変更なし)。release-pre full audit C0/H0 (AUDIT_2110) + secure fresh (bdd51f0)。
ユーザー「YES」承認 → git push (2427505) → deploy-prod.sh (20th) → smoke green。

## Decisions

- id: D20260618-023-00
  command: /flow:release
  phase: §3.3 / §3.4
  question: revise inbox-ux 本番反映 (Class B)
  chosen: YES → 20th deploy 成功
  chosen_type: explicit-choice
  context: |
    live PJ・code-only。§3.3 ハードゲートで明示承認 → ユーザー YES → deploy-prod.sh (env/DB 変更なし、
    .vercelignore で 8 関数維持) → smoke green (frontend 200 / feedback-inbox 401 authed / public-status 200)。
    revise inbox-ux 完全 closed (実装 + prod)。promote 不発火 (internal 非公開)。
