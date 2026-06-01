# Postmortem: dashboard multi-series 描画崩れ（chart 線断裂・x ずれ・ミリ秒表示）

> **重大度**: high
> **発生日**: 2026-06-01 観測（混入は timeseries-topchart 改修以降）
> **対応完了日**: （実装後に更新）
> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`

---

## 1. 概要
2 サービス登録後の dashboard 時系列チャートで、同一 run の service 間 capturedAt が `new Date()` の
per-row 生成でずれ、chart の完全一致マージ + カテゴリ軸 + connectNulls 既定 false により折れ線が
途切れ・x がずれ・軸がミリ秒表示になった。中核 UC（service 横断比較）が 2 サービス以上で機能不全。
データ破損はなく表示・整列層のみ。

## 2. 時系列
| 時刻 | イベント | 対応 |
|---|---|---|
| ~2026-05-28 | timeseries-topchart で multi-series chart 導入（整列済みテストデータで GREEN） | 混入 |
| 2026-06-01 | 運用者が 2 サービス登録後に chart 崩れを発見（404 secret 調査の流れで） | claim C20260601-002 起票 |
| 2026-06-01 | 三項照合で bug 判定 → /flow:fix、根本原因確定（per-row capturedAt + 軸設計） | 本 fix |

## 3. 影響範囲
| 項目 | 内容 |
|---|---|
| 影響ユーザー | セルフ運用（運用者のみ）。外部公開ユーザーなし |
| データ損失 | なし（usage_snapshots 無事） |
| ダウンタイム | なし |
| 売上 / SLA 影響 | なし |
| セキュリティ影響 | なし |
| 機能影響 | 2 サービス以上の dashboard 重ね描き比較が不可 |

## 4. 検知の経緯
- 開発者（運用者）の実機目視。404/secret 別件（C20260601-001）の確認中に chart 崩れを発見。
- 監視アラートでは検知されず（描画の質は監視対象外）。

## 5. 対応の流れ
1. 検知（実機）→ claim 三項照合で bug 判定。
2. 根本原因分析（5 Whys）で per-row capturedAt + chart 軸設計の噛み合わせ不全を特定。
3. 修正計画（run 単一 capturedAt + chart 時間軸化）→ /dev-tdd で実装（予定）。
4. unit + E2E GREEN → preview → 本番。

## 6. 直接原因 + 根本原因
（`001_ROOT_CAUSE.md` 参照）直接: runner per-row `capturedAt` + MetricChart 完全一致マージ/カテゴリ軸/
connectNulls 既定。根本: 「1 run = 単一論理時刻」不変条件の未定義 + chart x 軸前提（カテゴリ vs 時間）の
producer/consumer 間不整合。

## 7. 学習事項
### 7.1 良かった点
- 表示層のみでデータ破損なし。claim→fix の三項照合で根本原因まで短時間で到達。
- 既存 `startedAt`（run 単一時刻）が既にあり、最小修正で不変条件を確立できる。

### 7.2 改善点
- テストが**固定・整列済み timestamp** を使い、本番の per-row ドリフト（複数 service × 実 `new Date()`）を
  再現していなかった。「テストが通る ≠ 本番で正しい」典型。
- multi-series chart 導入時に「2 サービス以上 × 実時刻」の視覚確認が抜けた。

## 8. 再発防止策
| 対策 | 種別 | 担当 | 期限 |
|---|---|---|---|
| 「1 run = 単一 capturedAt」を SPEC（collection）に不変条件として明記 | ドキュメント | seiji | fix 実装時 |
| runner テストに**可変クロック**（呼ぶたび進む now）を導入し per-row ドリフトを検出 | テスト | seiji | 本 fix（FX-U-01） |
| multi-series chart に「複数 service × ミリ秒差同時刻」統合テストを追加 | テスト | seiji | 本 fix（FX-U-02〜04） |
| chart の x 軸は連続時間軸（type=number/time）を標準とする方針を MetricChart に明記 | ドキュメント/設計 | seiji | 本 fix |
| dashboard E2E に 2 service 重ね描きシナリオを追加 | テスト(E2E) | seiji | /flow:e2e |

## 9. タイムライン KPI
| 指標 | 値 |
|---|---|
| MTTD（混入→検知） | ~4 日（5/28 混入 → 6/1 検知） |
| MTTR（検知→修正完了） | （実装後に更新） |

## 10. 関連リンク
- 起点クレーム: `../claim_C20260601-002_20260601_chart-multiseries-render/`
- 基準 SPEC: `../revise_timeseries-topchart_20260528/001_REVISE_SPEC.md`
- 発生源: `src/components/MetricChart.tsx`, `src/features/collection/runner.ts:57`, `api/cron/collect.ts`

## 11. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-01 | 初版作成（実装前） | /flow:fix |
