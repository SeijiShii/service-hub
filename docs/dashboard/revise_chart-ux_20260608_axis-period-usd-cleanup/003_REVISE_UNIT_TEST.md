# dashboard 単体テスト計画（上部 chart 時間軸統一 + 期間選択 + usd 系 chart 削除）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `summary.test.ts` / `DashboardCharts.test.tsx` / `MetricChart.test.tsx` / `queries.test.ts`
> **最終更新**: 2026-06-08

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U-A-01 | `summary.ts DASHBOARD_CHARTS` | 定数参照 | 長さ 2、`[{metricKey:"mau"},{metricKey:"revenue_total_yen"}]` の順 |
| U-A-02 | `summary.ts DASHBOARD_CHART_SOURCE_METRICS` | 定数参照 | `["mau","revenue_total_yen"]`（revenue_month_usd / ai_cost_month_usd を含まない） |
| U-A-03 | `buildDashboard().charts` | mau+revenue_total_yen の chartSnapshots | charts 長 2、各 series が全 active service 分（points 整列） |
| U-A-04 | `MetricChart` domain prop | `domain={[t0,t1]}` + 2 series | XAxis domain が `[t0,t1]`（data-* or レンダリング検証）。未指定時は従来描画 |
| U-A-05 | `DashboardCharts` 共有 domain | 2 chart（点の範囲が異なる） | 両 MetricChart に同一 domain `[minMs,maxMs]`（全 chart points の union）が渡る |
| U-A-06 | `parsePeriod` | `"7d"`/`"30d"`/`"all"` | そのまま返す |
| U-A-07 | `periodToSinceIso` | `("7d", nowMs)` / `("30d", nowMs)` / `("all", nowMs)` | now−7日 / now−30日 / `new Date(0).toISOString()` |
| U-A-08 | api `summary` handler | `req.query.period="7d"` | recentSnapshots が now−7日相当 since で呼ばれる（モック検証） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-E-01 | `parsePeriod` | `"foo"` / `undefined` / `""` / 配列 | `"30d"` に正規化（例外なし） |
| U-E-02 | api `summary` | period 不正値 | 30 日窓で動作（200、charts 返却） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-B-01 | `DashboardCharts` 共有 domain | 全 chart points が空 | domain 未指定（undefined）→ MetricChart は「データなし」/従来 fallback |
| U-B-02 | `DashboardCharts` 共有 domain | 1 点のみ | min==max の domain（MetricChart が破綻しない） |
| U-B-03 | `periodToSinceIso("all")` | epoch0 | `"1970-01-01T00:00:00.000Z"` |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| U-M-01 | `summary.test.ts` chart 件数群 | charts 長 5（biz-charts+収益で 4→5） | charts 長 2 | usd 系 3 chart 削除 |
| U-M-02 | `summary.test.ts` profit 派生 chart 群 | profit series = revenue−cost を検証 | **削除**（§3）。代わりに「profit chart が存在しない」を確認 | profit chart 廃止 |
| U-M-03 | `summary.test.ts` 課金額/コスト chart 検証 | revenue_month_usd / ai_cost_month_usd chart の series 検証 | **削除**（§3） | chart 廃止（DB 収集は別途継続、source metrics test は U-A-02 でカバー） |
| U-M-04 | `DashboardCharts.test.tsx` ヘッダ文言 | 「直近 30 日の推移」を assert | 「収益・利用の推移」＋期間セレクタ存在を assert | 文言変更 + セレクタ追加 |
| U-M-05 | `DashboardCharts.test.tsx` chart 枚数 | 5 枚レンダリング | 2 枚レンダリング | chart 削減 |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| D-01 | `summary.test.ts` の profit 派生系列値検証（revenue−cost を capturedAt で整合） | profit chart 廃止。profitAt 純関数自体の test は `profitability.test.ts`（テーブル採算列用）に残るため SoT は失われない |
| D-02 | 課金額(revenue_month_usd)/コスト(ai_cost_month_usd) chart の series 構築検証 | chart 廃止 |

## 4. リグレッション強化

- 既存テスト維持: テーブル「採算」列（`profitability.test.ts` / `ServiceRow.test.tsx`）は**無変更で全 green** を確認（chart 削除がテーブル列に波及しないことの回帰固定）。
- `queries.test.ts recentSnapshots`: 既存のまま（period による sinceIso 切替は呼び出し側＝api の責務、recentSnapshots 自体は不変）。
- service-detail の MetricChart 利用（単体 series, domain 未指定）が従来描画であることを `MetricChart.test.tsx` の既存ケースで担保（domain optional 追加が破壊しない）。

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| api summary の `recentSnapshots` | （chart test では未モック / 直接 buildDashboard） | api handler test で recentSnapshots を spy し sinceIso 引数を検証 | period→since 変換の単体検証のため |
| `Date.now()` | — | api handler / periodToSinceIso test では固定 now を注入（`periodToSinceIso(period, nowMs)` に nowMs を引数化）して決定的に | 時刻依存の不安定化を避ける |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（parsePeriod の allowlist 分岐を網羅） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:revise |
