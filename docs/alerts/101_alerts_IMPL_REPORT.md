# alerts 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（Phase3 反復7）/ **状態**: 完了（GREEN）

## 実装ファイル（src/features/alerts/）
| ファイル | 内容 |
|---|---|
| evaluate.ts | 閾値判定(down/free_tier_over/free_tier_80pct)+重複抑制(open 照合)+回復(resolve)。新規発火分を返す |
| notify.ts | 未通知を channel(注入)送信→markNotified。送信失敗で markNotified しない(再試行) |
| index.ts | バレル |

## 設計反映 / 論点
- O35 注入: getOpenAlerts/recordAlert/resolveAlert/channel/markNotified を deps 注入 → mock テスト。
- 重複抑制: (slug,provider,rule) の open があれば再発火しない。回復: 未発火 open を resolve。
- [論点-AL1] 通知チャネル: channel は注入(Webhook/メール/no-op)、実バインドは bootstrap。
- collection の onCollected hook から evaluate→notify を呼ぶ配線は bootstrap。

## 検証
- `npm run test`: 69 passed（alerts 9 + 既存 60）/ `npm run typecheck`: green。
