# alerts 機能仕様書

> **役割**: 収集したメトリクスを閾値判定し、無料枠超過・ダウン等を検知 → alert_events 記録 + seiji へ通知。
> **タグ**: feature, stateful（alert ライフサイクル）
> **最終更新**: 2026-05-26
> **入力**: `../concept.md`（§1.1 UC3 / §4.6）, `../_shared/{db,types}/`, `../collection/`, `../registry/`
> **依存**: `_shared/db`, `collection`（収集直後に呼ばれる）

---

## 1. 詳細 UC
### UC3（concept §1.1）: 無料枠超過アラート
- **トリガー**: collection の各ラン完了時に `evaluate(snapshots, services)` が呼ばれる。
- **処理**:
  1. 各 service × metric について、`ServiceDescriptor.thresholds`（registry）と取得値を照合。
  2. ルール判定: `down`（ping up=0）/ `free_tier_80pct` / `free_tier_over`（使用量 ≥ 閾値）。
  3. 新規発火は `recordAlert`（db）+ **通知**（未通知のもの）。既知の継続中アラートは重複通知しない。
  4. 回復（次ラン up / 枠内）で `resolvedAt` を更新。
- **出力**: alert_events 記録 + 通知送信（seiji へ）。

## 2. 入出力
### 2.1 提供関数
```ts
evaluate(snapshots: SnapshotRow[], services: ServiceDescriptor[]): Promise<AlertEvent[]>;  // 新規発火分
notify(events: AlertEvent[]): Promise<void>;   // 未通知のものを送信 → notifiedAt 更新
```
### 2.2 副作用
- db（recordAlert / resolve / openAlerts）。
- 通知送信（チャネルは [論点-AL1]）。

## 3. データモデル
新規 entity なし。`alert_events`（db）を読み書き。閾値は `ServiceDescriptor.thresholds`（registry / services.toml）。

## 4. バリデーション + エラーケース
| ケース | 振る舞い |
|---|---|
| thresholds 未設定 | down のみ判定（使用量系はスキップ） |
| 重複発火 | 同一(service,provider,rule) の未解決アラートがあれば再通知しない |
| 通知失敗 | notifiedAt を更新せず次回再試行（ログ） |
| 回復 | 次ランで条件解消 → resolvedAt 更新（回復通知は任意） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| 重複抑制 | 継続アラートは 1 回のみ通知 | 通知疲れ回避 |
| 即時性 | 収集直後に評価（リアルタイム不要） | concept §3 ベストエフォート |
| 通知到達 | seiji が「気づける」チャネル | concept §1.1 UC3 |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| collection | 収集直後に evaluate を呼ばれる |
| db | recordAlert/openAlerts/resolve |
| registry | thresholds |
| dashboard | AlertBanner / openAlerts 表示（display は dashboard） |

## 6. タグ別追加項目
### stateful
- alert ライフサイクル: triggered → notified → resolved。重複抑制は未解決チェック。

## 7. スコープ外
- アラートの画面表示（dashboard の AlertBanner / openAlerts）。pull（collection）。

## 8. 未決事項
### [論点-AL1] 通知チャネル
- **影響範囲**: notify 実装、§4.3 リソース選定（メール送信等）
- **問い**: seiji への通知を何で送るか（メール / Slack / Telegram / push）。単一ユーザー内部ツールなので軽量で十分。
- **候補**: A) メール（Resend 無料枠）／ B) Slack/Telegram Webhook（無料、即時性） ／ C) ダッシュボード内通知のみ（外部送信なし）。
- **推奨**: B（Webhook、無料 + 即気づける）or C（最小、外部送信なし）。MVP は C + B の片方。
- **判断期限**: alerts 実装時（実 Webhook URL は release/env）
- **担当**: seiji

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復10） | /flow:feature |
