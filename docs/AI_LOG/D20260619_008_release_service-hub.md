# AI_LOG — /flow:release service-hub (22nd deploy, inquiries-reply-channel)

- **実行日時**: 2026-06-19 (JST)
- **コマンド**: /flow:release
- **対象**: service-hub (feedback-inbox inquiries-reply-channel 本番反映)
- **実行者**: Claude (Opus 4.8) + seiji
- **状態**: 完了
- **metrics**: deploy_target=production / deployed_url=https://service-hub.givers.work / check_result=smoke green / paid_confirmed=n-a
- **含まれる decision 範囲**: D20260619-037 〜 D20260619-038

## 主要決定サマリ
| id | テーマ | chosen | type |
|---|---|---|---|
| D20260619-037 | inquiries 有効化 + デプロイ (Class B/C) | デプロイ + 本番 env HUB_FEEDBACK_SOURCES に kind:inquiries 設定 | explicit-choice |
| D20260619-038 | デプロイ実行 (Class B) | 22nd deploy 成功 (dpl_b9e5egd5K5Q56NBbsMaoXhyViasA)、smoke green | explicit-choice |

## 依存関係
- 実装: `D20260619_007_tdd_feedback-inbox_revise_inquiries-reply-channel.md`
- 先行 deploy: 21st (inbox-pull-source、shipyard 無登録 pull 有効化)

## Decisions

```yaml
- id: D20260619-037
  timestamp: 2026-06-19T02:15:00+09:00
  command: /flow:release
  phase: §3.3 Class B/C 境界
  question: 本番デプロイ + shipyard inquiries kind 有効化 (email 返信導線)
  options:
    - "デプロイ + inquiries 有効化"
    - "デプロイのみ (inquiries 後で)"
    - "まだデプロイしない"
  recommended: デプロイ + inquiries 有効化 (返信可能化の目的を達成)
  chosen: デプロイ + 本番 env HUB_FEEDBACK_SOURCES を kind:inquiries に切替
  chosen_type: explicit-choice
  depends_on: [D20260619-018]
  context: |
    kind=feedback (scrubbed) → kind=inquiries に切替で shipyard から email/adminUrl 取り込み。
    同 thread id で冪等 upsert = 既存行が context.email/adminUrl を獲得 (重複なし)。

- id: D20260619-038
  timestamp: 2026-06-19T02:20:00+09:00
  command: /flow:release
  phase: §3.4 デプロイ実行 + smoke
  chosen: 22nd deploy 成功 (dpl_b9e5egd5K5Q56NBbsMaoXhyViasA, READY)。smoke green = frontend 200 / feedback 200 / inbox 401 authed / admin/collect 401 authed (新 import 非破壊)
  chosen_type: explicit-choice
  depends_on: [D20260619-037]
  context: scripts/deploy-prod.sh (sync-prod-env で kind:inquiries 同期 → vercel deploy --prod)。
```
