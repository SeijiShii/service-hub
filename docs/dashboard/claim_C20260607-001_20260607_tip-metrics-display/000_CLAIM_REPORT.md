# クレーム調査レポート

**claim id**: C20260607-001
**実施日**: 2026-06-07
**対象機能**: dashboard
**緊急度推定**: medium

## 1. クレーム原文

```
各サービスが service-info の metrics[] で申告する投げ銭(tip)指標が service-hub
ダッシュボードに反映されない。期待: 各サービスカードに投げ銭の累計(件数・金額)が
表示される。現実: 表示されない(実装漏れ)。

背景: producer 側 bousai-bag-checker が service-info v2 の metrics[] に新キー
tip_count(unit:count) / tip_total_yen(unit:jpy) を追加し本番デプロイ済(2026-06-07、
起点 claim/fix/revise C20260607-001)。本番 GET /api/hub/service-info の metrics[] に
{ key:"tip_count", value:1, unit:"count" } / { key:"tip_total_yen", value:100, unit:"jpy" }
が実際に出ていることを確認済み。

確認してほしい三項照合の要点:
1) service-hub が pull した metrics[] を「汎用描画(全キーをそのまま表示)」しているか、
   「既知キーのみ選択描画(mau/users_total/error_count_24h だけ)」しているか。
2) 契約型 _shared/types の ServiceInfoResponse / 既知メトリクスキー定義に
   tip_count / tip_total_yen を加える必要があるか。
3) ダッシュボードの各サービスカード(or 集計ビュー)に tip_total_yen(¥表記) / tip_count を
   表示する実装が必要か。

判定は revise(既存ダッシュボードに表示追加)になる見込み。汎用描画なら表示確認のみで close。
通貨は jpy 固定(¥表記)、PII なし(集計値のみ、O48)。

provenance: bousai-bag-checker fix/revise C20260607-001、perspectives O48 CF-20260607-002
(producer の新 metric key は consumer 側実装を cross-repo tracked follow-up で起票する)。
```

## 2. 分解結果

### 2.1 期待挙動 (Expected)
各サービスカード(dashboard 一覧の各サービス行)に、そのサービスが service-info で自己申告した
投げ銭累計が表示される — tip_total_yen(¥表記の金額) と tip_count(件数)。

### 2.2 現実挙動 (Actual)
本番 service-info の metrics[] には tip_count:1 / tip_total_yen:100 が出ており、HUB の収集経路
(service-info adapter → usage_snapshots → buildDashboard VM) は汎用に全キーを受理・保存・VM 投影
しているが、dashboard の表示層 (ServiceRow.tsx) が既知キーのみ選択描画のため tip 列が存在せず、
画面に一切現れない。

### 2.3 発生条件
- 操作手順: producer が service-info v2 で tip_count/tip_total_yen を申告 → HUB が pull →
  admin dashboard 一覧を表示。
- 環境: service-hub 本番 (admin dashboard)。
- 時刻: 2026-06-07 (producer 本番デプロイ後)。
- 対象: tip を申告する全サービス (現状 bousai-bag-checker、今後横展開)。

### 2.4 影響範囲
- 該当: tip メトリクスを申告するサービス全て。
- 業務影響: 投げ銭(収益関連)の可視化欠落。データ損失はなし(収集・保存は正常)。
- データ影響: なし。tip_count/tip_total_yen は usage_snapshots に汎用キーとして既に蓄積されている。

### 2.5 報告経路
- 経路: 社内 (cross-repo follow-up、producer 側 C20260607-001 の consumer 連携)。
- 温度感: 冷静 (計画的な producer→consumer 連携、CF-20260607-002 で tracked)。

### 2.6 報告者文脈
producer 側で投げ銭機能を実装・本番化し metrics[] に申告まで完了したので、HUB ダッシュボードでも
投げ銭の累計を一目で見えるようにしたい (cross-repo の表示側を閉じたい)。

## 3. 過去類似クレーム

| claim id | 日付 | 判定 | 関連度 |
|---|---|---|---|
| (dashboard の metric 表示追加系) CF-20260528-020 favicon-projection / business-observability revise | 2026-05-28〜30 | revise | 高 — 「producer 申告の新フィールド/新 metric を内部 dashboard の VM + 表示に投影する」同型。本件はその tip 版。|
