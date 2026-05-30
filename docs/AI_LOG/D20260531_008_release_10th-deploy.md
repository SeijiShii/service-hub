# D20260531_008 — /flow:release (10th deploy: biz-charts)

**実行日時**: 2026-05-31 (+09:00)
**コマンド**: /flow:release
**対象**: service-hub 本番 (biz-charts 反映、10th deploy)
**実行者**: SeijiShii (via Claude Code) — flow:auto P4.7 Release gate dispatch (D20260531_001 反復7)
**状態**: 完了

metrics: { deploy_target: production, deployed_url: "https://service-hub.givers.work", deployment_id: dpl_A1v4GA2yrduXehqUfPQT5CeEXfqz, build_sec: 24, smoke: "frontend 200 / api 401 / public 200" }

## 含まれる decision 範囲
D20260531-012 〜 D20260531-013

## Phase 1.0 live 化判定
- ① `.env.production.local` CLERK_SECRET_KEY=sk_live_* / VITE_CLERK_PUBLISHABLE_KEY=pk_live_* → **live 化済**
- → test→live swap skip。残作業 = biz-charts (+14 undeployed commits since 9th deploy c64d329) の再デプロイのみ。FILL 不要。

## Phase 2 動作確認 (軽め)
- biz-charts は E2E が production build (npm run build && preview) 相手に 9/9 green + dashboard 実画面スクショ確認済 (D20260531_002/005)。
- api 関数数 = 7 (非 test) < 12 (Hobby 上限) で deploy 数ガード安全。
- → 別途ローカルスモークは冗長 (E2E が build+UI を網羅済)、Phase 3 へ。

## Phase 3 デプロイ (Class B 明示確認待ち)

## Decisions

```yaml
- id: D20260531-012
  timestamp: 2026-05-31T06:30:00+09:00
  command: /flow:release
  phase: Phase 1.0 live 判定 + Phase 3 Class B 確認提示
  question: biz-charts 10th deploy の Class B 確認
  chosen: ユーザー承認「今デプロイ (推奨)」
  chosen_type: explicit-choice
  context: |
    live 化済 (sk_live_/pk_live_)、FILL 不要。biz-charts 含む 14 commits を prod 再デプロイ。
    deploy-prod.sh (sync-prod-env → vercel build → vercel deploy --prod --yes)。
    Class B (B-2 外部公開) 明示確認 §3.3 ハードゲートで承認。
- id: D20260531-013
  timestamp: 2026-05-31T06:35:00+09:00
  command: /flow:release
  phase: Phase 3 deploy + post-deploy smoke
  question: 10th deploy 実行結果
  chosen: ✅ 成功 (dpl_A1v4GA2yrduXehqUfPQT5CeEXfqz、aliased givers.work、smoke 全 green)
  chosen_type: auto-recommended
  context: |
    deploy-prod.sh で本番反映、build 24s READY。post-deploy smoke:
    frontend 200 / /api/dashboard/summary 401 (Clerk 単一ユーザーゲート稼働、正常) / public 200。
    biz-charts UI は E2E が production build 相手に検証済 (Clerk ゲート内のため curl 視覚確認は不可)。
    P4.8 Promote 不発火 (concept §4.7 internal/非公開)。
```
