# クレーム調査レポート

**claim id**: C20260618-001
**実施日**: 2026-06-18
**対象機能**: feedback-inbox
**緊急度推定**: medium

## 1. クレーム原文

```
shipyard にテストメッセージが入っているが、feedback-inbox で全ての期間 (period=all) を選んでも
読み込まれないのはなぜか。期待: shipyard の問い合わせ/フィードバックが ServiceHUB の運営者
インボックスに表示される。現実: 空のまま。
```

## 2. 分解結果

### 2.1 期待挙動 (Expected)
shipyard (givers.work showcase) に届いた問い合わせ/フィードバックのテストメッセージが、ServiceHUB の運営者インボックス `/feedback` に表示される (period=all で全件)。

### 2.2 現実挙動 (Actual)
`/feedback` が period=all でも空 (全 0 件)。shipyard のメッセージが一切表示されない。

### 2.3 発生条件
- 操作: `/feedback` を開く / 期間フィルタを「全期間」にする
- 環境: 本番 https://service-hub.givers.work (20th deploy)
- データ: shipyard 側 contact form にテストメッセージ投入済

### 2.4 影響範囲
- 運営者 (seiji) 単独。データ消失なし (取り込みが発生していないだけ)。

### 2.5 報告経路
- seiji 直接 (/flow:claim)

### 2.6 報告者文脈
feedback-inbox の統合インボックスに、実データ (shipyard のテストメッセージ) が流れることを確認したかった。

## 3. 過去類似クレーム
- 該当なし (feedback-inbox は今セッションで新規実装、初の claim)
