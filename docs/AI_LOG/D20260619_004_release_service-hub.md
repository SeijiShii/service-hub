# AI_LOG — /flow:release service-hub (21st deploy, inbox-pull-source)

- **実行日時**: 2026-06-19 (JST)
- **コマンド**: /flow:release
- **対象**: service-hub (feedback-inbox inbox-pull-source 本番反映)
- **実行者**: Claude (Opus 4.8) + seiji
- **状態**: 完了
- **metrics**: deploy_target=production / deployed_url=https://service-hub.givers.work / check_result=smoke green / paid_confirmed=n-a (無課金 internal tool)
- **含まれる decision 範囲**: D20260619-017 〜 D20260619-019

## 主要決定サマリ
| id | テーマ | chosen | type |
|---|---|---|---|
| D20260619-017 | live 化状態判定 (§1.0) | live 化済 (.env.production.local 設定済、20x deploy)、prod-direct (§1.0c fleet model) | auto-recommended |
| D20260619-018 | shipyard 有効化 + デプロイ (Class B/C) | デプロイ + HUB_FEEDBACK_SOURCES=givers.work で shipyard 有効化 | explicit-choice |
| D20260619-019 | デプロイ実行 (Class B) | 21st deploy 成功 (dpl_Ar2eAqyuYNM4ybkoScFAiiJywoEa)、smoke green | explicit-choice |

## 生成・更新したアーティファクト
- 本番デプロイ (21st、Vercel CLI prod) + Vercel prod env に HUB_FEEDBACK_SOURCES 同期
- `.env.production.example` (HUB_FEEDBACK_SOURCES 記載)
- ticket-status → shipped、SCENARIO §5 / INDEX 更新

## 依存関係
- 実装: `D20260619_003_tdd_feedback-inbox_revise_inbox-pull-source.md`
- 設計: `D20260619_001_revise_feedback-inbox_inbox-pull-source.md`

## Decisions

```yaml
- id: D20260619-017
  timestamp: 2026-06-19T00:55:00+09:00
  command: /flow:release
  phase: Step 0 / §1.0 live 化判定
  question: live 化状態 + デプロイ target
  chosen: live 化済 (① .env.production.local に CRON_SECRET/HUB_SERVICE_INFO_SECRET 設定済、20x prod deploy) → prod-direct (§1.0c microservice fleet)
  chosen_type: auto-recommended
  depends_on: []
  context: 無課金 internal tool。本改修は live PJ の追加デプロイ。UI+env parser additive・低リスク。

- id: D20260619-018
  timestamp: 2026-06-19T00:58:00+09:00
  command: /flow:release
  phase: §3.3 Class B/C 境界
  question: 本番デプロイ + shipyard 無登録取り込みの有効化
  options:
    - "デプロイ + shipyard 有効化"
    - "デプロイのみ (shipyard 後で)"
    - "まだデプロイしない"
  recommended: デプロイ + shipyard 有効化 (元要望「登録なしで取得」を満たす)
  chosen: デプロイ + shipyard 有効化 (HUB_FEEDBACK_SOURCES=[{slug:shipyard,name:Shipyard,url:https://givers.work}])
  chosen_type: explicit-choice
  depends_on: [D20260619-004]
  context: ユーザー承認。givers.work = shipyard origin (claim C20260618-001)。

- id: D20260619-019
  timestamp: 2026-06-19T01:05:00+09:00
  command: /flow:release
  phase: §3.4 デプロイ実行 + post-deploy smoke
  question: 21st deploy 実行
  chosen: 成功 (dpl_Ar2eAqyuYNM4ybkoScFAiiJywoEa, READY, aliased givers.work)。smoke green = frontend 200 / feedback 200 / feedback-inbox 401 authed / admin/collect 401 authed (関数 load OK = 新 import 非破壊)
  chosen_type: explicit-choice
  depends_on: [D20260619-018]
  context: scripts/deploy-prod.sh (sync-prod-env → vercel deploy --prod)。HUB_FEEDBACK_SOURCES を Vercel prod env に同期済。
```
