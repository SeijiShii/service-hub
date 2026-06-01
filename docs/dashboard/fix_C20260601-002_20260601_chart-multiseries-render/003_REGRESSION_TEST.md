# リグレッションテスト計画: dashboard multi-series 描画崩れ

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-06-01

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト（修正前: 失敗 / 修正後: 成功）
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| FX-U-01 | `runCollection`（runner） | **実 `now`（既定）相当を模し、now を呼ぶたびに進む可変クロックを注入**し 2 service × 複数 metric を収集 | 1 run 内の全 SnapshotRow の `capturedAt` が**同一値**（run の startedAt）であること。← 固定 now でなく「呼ぶたびに進む now」で per-row ドリフトを検出 |
| FX-U-02 | `MetricChart.mergeSeries`（or 公開挙動） | 2 series が**ミリ秒だけ異なる同一論理時刻**の点を持つ | 同一時刻バケットで 1 行にマージされ、両 series の値が同一 x 行に揃う（`data-points` が時刻数ぶん、service 数ぶんに分裂しない） |
| FX-U-03 | `MetricChart` XAxis | epoch ms を持つ点列 | x が**連続時間軸**（type=number/time）で実間隔比例配置、tick が**分単位**（ミリ秒なし）整形 |
| FX-U-04 | `MetricChart` `<Line>` | 一部時刻で片 series のみ値あり（疎） | 線が途切れない（connectNulls 方針 or 整列で null 解消）。2 service で 2 本描画 |

### 1.2 修正後に必ず通るテスト
| ID | 対象 | 期待 |
|---|---|---|
| FX-U-05 | dashboard 2 service 重ね描き | series 2 本、各 points が同 x 整列、`data-series-count=2` |

## 2. 類似境界条件テスト
| ID | 境界条件 | 期待 |
|---|---|---|
| FX-B-01 | 3 service 以上 | 全 series が同時刻で整列、全本描画 |
| FX-B-02 | service 間で観測時刻が真に異なる（別 run） | 別 x として時間軸上の正しい位置に配置 |
| FX-B-03 | 単一 service（service-detail 経路） | 従来通り 1 本描画（後方互換、リグレッションなし） |
| FX-B-04 | 空 points / 全欠落 | 「データなし」fallback 維持（既存挙動） |
| FX-B-05 | last_deploy_at（epoch 値メトリクス、service-detail 残存時） | 値軸/ラベルが従来通り（x 時間軸化と非衝突） |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| RG-01 | `runner.test.ts`（ok/partial/failed, 冪等, favicon meta） | 収集オーケストレーションの挙動不変。capturedAt 単一化で固定 now 系の期待値は不変 |
| RG-02 | `summary.test.ts`（BC-U-* / TS-M-*, buildCharts 4 件・採算派生・capturedAt ずれ起点） | series 構築ロジックは不変（整列は MetricChart 側）。BC-U-21（capturedAt ずれ → revenue 起点）への影響を要確認 |
| RG-03 | `DashboardCharts.test.tsx` | 4 chart render / 空データ fallback 維持 |
| RG-04 | `MetricChart.test.tsx`（TS-U-23 等、data-points） | x 軸時間軸化で `data-points` 期待値の更新が必要な場合は本 fix 範囲で更新（意図的変更） |

## 4. E2E シナリオ追加
| シナリオ ID | 内容 |
|---|---|
| FX-E2E-01 | 2 service 分の snapshot（同一 run 同時刻含む）を seed → dashboard 表示 → chart に 2 本の線が連続描画され、同時刻点が整列、x 軸が分単位であることを確認（`/flow:e2e` で実装） |

## 5. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| 時刻（runner now） | **可変クロック**（呼ぶたびに +1ms 等） | per-row ドリフトを再現して FX-U-01 で検出するため。※固定 now はこのバグを隠すので不可 |
| chart 入力 points | ミリ秒差の同一論理時刻ペア | 整列マージ FX-U-02 の検証 |

## 6. カバレッジ目標
- 修正コード行: 100%（runner capturedAt 単一化 + MetricChart 軸/マージ/Line）。
- 関連境界条件: 90%+。

## 7. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-01 | 初版作成 | /flow:fix |
