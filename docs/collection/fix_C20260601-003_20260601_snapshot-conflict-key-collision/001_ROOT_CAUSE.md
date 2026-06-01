# 根本原因: usage_snapshots 同一 conflict key 衝突で collect 全 insert 失敗 (C20260601-003)

> リグレッション元: fix C20260601-002 (1 run = 単一 capturedAt)。本番 collect cron (2026-06-01T03:36:35Z) で発覚。

## 症状
- 本番 collect: `db: Failed query: insert into "usage_snapshots" ... on conflict ("service_slug","metric_key","captured_at") do update ...` で全 snapshot insert 失敗 (収集停止)。
- 併発: `hana-memo / service-info / http_500` (別事象、本 fix の対象外メモ参照)。

## 5 Whys
| # | 問い | 答え |
|---|---|---|
| 1 | なぜ insert が全失敗? | Postgres SQLSTATE 21000「ON CONFLICT DO UPDATE cannot affect row a second time」。1 INSERT 内に同一 conflict key の行が 2 つ。 |
| 2 | なぜ同一 conflict key が 2 行? | unique index `uniq_snap_svc_metric_time` = `(service_slug, metric_key, captured_at)`。bousai-bag-checker が `ping/up` と `service-info/up` を返し、両者 metric_key="up"・同一 service・**同一 captured_at**。 |
| 3 | なぜ captured_at が同一に? | fix C20260601-002 で runner の capturedAt を run 共有 (startedAt) に統一。複数 provider が同一 metric_key を返すと conflict key が衝突。 |
| 4 | なぜ修正前は起きなかった? | 修正前は per-row `new Date()` でミリ秒ドリフトし captured_at が provider 間で相違 → conflict key が衝突せず別行として保存 (偶然回避)。 |
| 5 | 根本原因 | **unique constraint が provider を含まないのに複数 provider が同一 metric_key を返す**設計と、「1 run = 単一 capturedAt」不変条件が両立していなかった。downstream (`latestPerService` DISTINCT ON `(service,metric)` / upsert) は provider を識別子に含めず **(service, metric, time) で last-wins** が正なので、insert 前に同一 conflict key を dedup すべきだった。 |

## 直接原因
`src/db/queries.ts` `upsertSnapshots`: rows をそのまま `.values()` に渡し、同一 conflict key の重複を除去していなかった。

## なぜテストで防げなかったか
runner の unit テストは `saveSnapshots` を mock (vi.fn) で受けており **DB unique constraint を再現しない**。FX-U-01 は 2 adapter (ping/neon) × 同一 metricKey="up" で実は衝突データを生成していたが、mock が黙って受理した (「テスト GREEN ≠ 本番正常」)。
