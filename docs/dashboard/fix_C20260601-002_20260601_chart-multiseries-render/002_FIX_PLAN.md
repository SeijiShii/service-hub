# 修正計画: dashboard multi-series 描画崩れ

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, 実装コード
> **最終更新**: 2026-06-01
> **方針**: 「1 run = 単一 capturedAt」不変条件の確立（producer 側）+ chart の時間軸化（consumer 側）の両輪。

---

## 1. 修正対象ファイル

| ファイル | 修正内容 | before 抜粋 | after 抜粋（方針） |
|---|---|---|---|
| `src/features/collection/runner.ts` | run 開始時に capturedAt を 1 度だけ確定し全行で共有 | `capturedAt: now().toISOString()`（行ごと、:57） | ループ前に `const capturedAt = startedAt`（既存 `startedAt` 流用）→ 全 SnapshotRow で同値使用 |
| `src/components/MetricChart.tsx`（XAxis） | x を連続時間軸化 + 分単位整形 | `<XAxis dataKey="capturedAt" .../>`（カテゴリ・整形なし） | `dataKey` を epoch ms（number）に、`type="number"` `scale="time"` `domain={['dataMin','dataMax']}` + `tickFormatter`（M/D HH:mm、ミリ秒除去） |
| `src/components/MetricChart.tsx`（mergeSeries） | timestamp 正規化後にマージ | capturedAt 文字列完全一致で `byTime` 集約（:62-76） | epoch ms（or 分バケット）をキーにマージ → 同時刻の複数 series を 1 行へ。行に x=epoch を保持 |
| `src/components/MetricChart.tsx`（Line） | 疎データの断裂防止 | `<Line ... />`（connectNulls 未指定、:151-161） | 整列後に必要なら `connectNulls` 付与（要否は整列修正後に再評価） |
| `src/components/MetricChart.tsx`（Tooltip labelFormatter） | 既存 labelFormatter を epoch 入力に整合 | `new Date(String(v))`（:139） | x が epoch number になるため `new Date(Number(v))` 系へ整合、分単位表示維持 |

> last_deploy_at（既存 epoch 値 + Y/M-D 系）の分岐（:40-45, :129-138）は service-detail で残存し得るため、x 軸時間軸化と**衝突しないこと**を確認（last_deploy_at は値が epoch、x はあくまで capturedAt epoch で別軸）。

## 2. 修正範囲の限定方針
- **根本原因（run 単一 capturedAt）+ 表示（時間軸化）の 2 点に限定**。alerts / profitability / registry 等へは波及させない。
- runner の capturedAt は既存 `startedAt`（run 開始時刻、既に 1 度だけ取得・:33）を流用 → 追加の時刻源を増やさず一貫性確保。
- 既存保存済み snapshot（過去の per-row ずれデータ）は遡及補正しない（表示側の正規化マージで吸収）。新規 run から整列。

## 3. 副作用なき確認方法
- 既存テスト維持: runner.test（固定 now で全行同 capturedAt → 単一化後も期待値不変）, summary buildCharts, DashboardCharts, service-detail。
- 追加テスト: 003_REGRESSION_TEST 参照（複数 service × 微小時刻差 → 整列マージ / 時間軸 tick / connectNulls）。
- 手動確認:
  1. 2 サービスで複数 run 後、dashboard で 2 本の線が連続描画される。
  2. 同一 run の点が同 x に重なる。
  3. x 軸ラベルが分単位（ミリ秒なし）。
  4. service-detail（単一 series）が従来通り描画される（リグレッション）。

## 4. リリース戦略
- 方式: **通常リリース**（表示層 + producer 時刻の軽微な修正、データ破損なし）。severity=high だが本番障害ではなく機能不全のため hotfix 緊急展開までは不要。
- フラグ: 不要。
- 展開: unit GREEN → `/flow:e2e`（dashboard chart E2E）→ preview 確認 → 本番（既存デプロイ手順）。

## 5. ロールバック方針
- コード revert で完全復帰可能（✅）。DB ロールバック不要（スキーマ変更なし、データ補正なし）。
- 手順: 当該コミットを revert → 再デプロイ。

## 6. 関係者通知
- セルフ運用のため通知不要。AI_LOG + INDEX に記録。

## 7. DoD
- [ ] 2 サービスで折れ線が 2 本連続描画される（再現せず）
- [ ] 同一 run の点が同 x に整列
- [ ] x 軸ラベルが分単位（ミリ秒なし）
- [ ] 003 REGRESSION_TEST 全成功
- [ ] service-detail 単一 series リグレッションなし
- [ ] 既存テスト破壊なし / `/dev-review` 通過
- [ ] Postmortem 再発防止策の担当・期限設定

## 8. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-01 | 初版作成 | /flow:fix |
