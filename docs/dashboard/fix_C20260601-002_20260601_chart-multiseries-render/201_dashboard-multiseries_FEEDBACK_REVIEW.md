# バグフィードバックレビュー: dashboard multi-series 描画崩れ fix (C20260601-002)

## レビュー日時
2026-06-01 12:19 (JST)

## ラウンド
1

## レビュー対象
| ファイル | 操作 | 備考 |
|---|---|---|
| `src/features/collection/runner.ts` | 変更 | capturedAt=startedAt 共有 |
| `src/components/MetricChart.tsx` | 変更 | mergeSeries epoch 集約 / XAxis time scale / connectNulls / tooltip |
| `src/features/service-detail/ServiceDetailView.test.tsx` | 変更 (test) | fixture ISO 化 |

## レビュー方式
orchestrator-direct (2 production ファイルの局所 diff のため 4 エージェント並列を割愛、8 観点をインラインで適用)。

## レビューサマリー
| 観点 | 指摘数 | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| データ型・型安全性 | 0 | 0 | 0 | 0 | 0 |
| インターフェース境界 | 0 | 0 | 0 | 0 | 0 |
| ロジックバグ | 1 | 0 | 0 | 0 | 1 |
| セキュリティ・権限 | 0 | 0 | 0 | 0 | 0 |
| エラーハンドリング | 0 | 0 | 0 | 0 | 0 |
| パフォーマンス | 0 | 0 | 0 | 0 | 0 |
| 仕様適合性 | 0 | 0 | 0 | 0 | 0 |
| 整合性パターン | 0 | 0 | 0 | 0 | 0 |
| **合計** | **1** | **0** | **0** | **0** | **1** |

## 指摘事項

### [FB1] merge 予約キー "x" と service slug の衝突可能性 → 修正済み
- **重要度**: LOW
- **観点**: ロジックバグ (8-7 無効値ガード / 予約キー衝突)
- **ファイル**: `src/components/MetricChart.tsx` (mergeSeries / XAxis)
- **問題**: merged row が epoch を `"x"` キーで保持していたため、service slug が万一 `"x"` だと `row[s.slug]` が epoch を上書きし時間軸が破綻する。登録サービスの slug は複数文字で実害確率は極めて低いが、予約キーを衝突しにくい名前にするのが安全。
- **修正方針**: 予約キーを `__x` に変更し XAxis dataKey も連動。
- **自動修正**: 可能 → 適用済み (内部キー rename、既存 render テストで保証)。

## 修正結果

### [FB1] → 修正済み
- **修正ファイル**: `MetricChart.tsx` (`X_KEY="__x"` 予約キー化、mergeSeries + XAxis dataKey)
- **追加テスト**: `MetricChart.test.tsx` FB1 (slug="x" でも data-points=2 維持)
- **テスト結果**: PASS (314/314)
- **VERIFY**: 5.4.a 学習観点 ✅ / 5.4.b 呼び出し元 (mergeSeries は private、外部参照なし) ✅ / 5.4.c 副作用なし ✅ / 5.4.d 過去指摘照合 ✅

## 問題なしの確認事項
- runner `startedAt` 共有: finishedAt は別途 now() で正しく取得、capturedAt のみ run 共有 (不変条件成立)。consumer (latest snapshot クエリ) は capturedAt desc 順で正常。
- `connectNulls`: 疎データで線連続化、意図通り。
- tooltip labelFormatter: x が全 metric 共通 epoch になり last_deploy_at 特例分岐を削除して一本化 (label=capturedAt の整形であり値整形は Y 軸 tickFormatterForMetric が担当、非衝突)。
- 単一点 (dot=false) の不可視性 は category 軸時代からの pre-existing 挙動で本 fix の導入ではない (out of scope)。
- bucketEpoch の NaN→0 fallback: 実 capturedAt は常に ISO のため発火しない防御コード。

## 手動動作確認の提案
### 判定: 推奨
chart 描画 (FE) 変更のため。`/flow:e2e` (P4.5/FX-E2E-01: 2 service 同一 run seed → 2 本連続描画 + 同時刻整列 + x 分単位) で代替検証可能。

## 関連 AI_LOG タイムライン
- claim: D20260601_002_claim_dashboard_C20260601-002
- fix 設計: D20260601_003_fix_dashboard_C20260601-002
- tdd 実装: D20260601_005_tdd_dashboard_fix_C20260601-002
- feedback: D20260601_006_feedback_dashboard (本セッション)

## 学習した新観点
- なし (予約キー衝突は既存観点 8-7 の範疇。汎用度は低く PJ 固有性も薄いため新規 L-/PL- 採番は見送り)
