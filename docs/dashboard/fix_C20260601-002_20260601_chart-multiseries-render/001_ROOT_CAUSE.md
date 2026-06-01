# 根本原因分析: dashboard multi-series 描画崩れ

> **入力**: `./000_調査レポート.md`, src/components/MetricChart.tsx, src/features/collection/runner.ts, api/cron/collect.ts, src/features/dashboard/summary.ts, src/db/queries.ts
> **最終更新**: 2026-06-01

---

## 1. 5 Whys

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜ 2 サービスで線が途切れ x がずれるか? | 各 series の点が、同一論理時刻でも x 軸上の別位置に置かれ、相互に null が交互混入するため。 |
| Why 2 | なぜ同一時刻の点が別 x になるか? | `MetricChart.mergeSeries`（:62-76）が `capturedAt` の**完全一致**でしか行を結合せず、わずかに異なる timestamp は別行（別 x）になるため。さらに XAxis がカテゴリ軸で実時間間隔を無視する。 |
| Why 3 | なぜ同一 run の各 service の capturedAt がわずかに異なるか? | `runner.ts:57` が SnapshotRow ごとに `capturedAt: now().toISOString()` を呼び、`now` 既定が `() => new Date()`（:31）。`api/cron/collect.ts` は `now` を渡さないため、本番では行ごとに `new Date()` が評価されミリ秒が相違する。 |
| Why 4 | なぜそれがテスト/レビューで防げなかったか? | `runner.test.ts:40` が `now: () => new Date("2026-05-26T00:00:00.000Z")` の**固定値**を注入。テストでは全行が同一 capturedAt になり mergeSeries が偶然整列するため、本番の per-row ドリフトが検出されない。MetricChart テストも事前整列済みの同一 timestamp を入力していた。 |
| Why 5 | なぜ「1 run = 複数行が別時刻」を許す設計だったか? | **根本原因**: 「1 collection run のスナップショットは単一の論理時刻を持つ」という不変条件が SPEC にもコードにも明示されず、`capturedAt` を行生成時の現在時刻に委ねていた。time-series chart 側も「x = 連続時間軸」でなく「x = capturedAt カテゴリ」を前提に実装され、両者の暗黙の前提が噛み合っていなかった。 |

## 2. 直接原因
| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/features/collection/runner.ts` | 57 | `capturedAt: now().toISOString()` を行ごとに評価 → 同一 run でも行間で時刻が相違 |
| `api/cron/collect.ts` | 24-50 | `runCollection` に `now` を渡さず既定 `() => new Date()` を使用（本番で per-row 評価） |
| `src/components/MetricChart.tsx` | 62-76 | `mergeSeries` が capturedAt 完全一致でのみマージ（正規化なし） |
| `src/components/MetricChart.tsx` | 103-109 | `XAxis dataKey="capturedAt"` カテゴリ軸 + `tickFormatter` 無し（時間軸でない・ISO 生表示） |
| `src/components/MetricChart.tsx` | 151-161 | `<Line>` `connectNulls` 未指定（既定 false）→ 非整列の null で線断裂 |

## 3. 根本原因
「**1 collection run のスナップショット群は単一の capturedAt（run の論理時刻）を共有する**」という不変条件が未定義・未実装。`capturedAt` を行生成時刻に委ねた結果、同一 run の service 間で時刻がずれ、chart の同一時刻整列が成立しない。加えて chart の x 軸が連続時間軸でなくカテゴリ軸で実装され、ずれと可読性低下を増幅した。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| テスト不足 | runner / MetricChart のテストが**固定・事前整列済みの timestamp** を使い、本番の per-row ドリフト（複数 service × 実 `new Date()`）を再現していなかった。multi-service × 微小時刻差の統合テストが不在。 |
| 設計（暗黙の前提） | 「run = 単一時刻」の不変条件が SPEC 未記載。chart の x 軸前提（カテゴリ vs 時間）が producer 側 capturedAt 生成と未調整。 |
| レビュー漏れ | timeseries-topchart 改修時に「2 サービス以上 × 実時刻」での重ね描き確認が抜けた（E2E fixtures も整列済みデータだった可能性）。 |

## 5. 仮説と検証
| 仮説 | 検証方法 | 結果 |
|---|---|---|
| per-row capturedAt が原因 | runner.ts:57 + api/cron/collect.ts（now 未注入）を確認 | ✅ 確定 |
| mergeSeries 完全一致が非整列を生む | MetricChart.tsx:62-76 読解 | ✅ 確定 |
| カテゴリ軸 + tickFormatter 無で x ずれ/ミリ秒 | MetricChart.tsx:103-109 読解 | ✅ 確定 |
| connectNulls 既定で線断裂 | MetricChart.tsx:151-161 + recharts 既定 | ✅ 確定 |
| テストが固定 now で見逃し | runner.test.ts:40 確認 | ✅ 確定 |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-01 | 初版作成 | /flow:fix |
