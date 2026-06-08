# dashboard 単体テスト計画（chart 線色パレットのバリエーション拡充）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `src/components/MetricChart.test.tsx`
> **最終更新**: 2026-06-08

---

## 1. 追加テストケース（`src/components/tokens.test.ts` 新規）

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| TK-U-01 | `CHART_SERIES_COLORS.length` | — | 8 |
| TK-U-02 | `chartSeriesColor(0)` | 0 | 青 `#5b9cf5` を含む（idx0 据置） |
| TK-U-03 | `chartSeriesColor(1)` | 1 | 暖色（橙 `#fb923c`）を含む（先頭で寒色固まりを解消） |
| TK-U-04 | 循環 | `chartSeriesColor(8)` | `chartSeriesColor(0)` と一致（idx%8） |
| TK-U-05 | 循環 | `chartSeriesColor(10)` | `chartSeriesColor(2)` と一致 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| TK-U-06 | 負 index | `chartSeriesColor(-1)` | 例外を投げない（実装上 `% length` は負を返し得るため、現状仕様の確認 or `((i%n)+n)%n` 化を判断） |

> ※ TK-U-06 は現実装 `index % length` が負 index で負添字→`undefined`→`!` で実行時エラーになり得る。
> 実呼び出しは `series.map((_, idx) => …)` で常に ≥0 のため実害は無いが、テストで明示し、
> 必要なら IMPROVE 段で `((index % n) + n) % n` に堅牢化する（任意、Class A）。

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| TK-U-07 | near-dup 不在 | 全 hex を小文字正規化し Set 化 | size === 8（重複色がない＝旧 `#34d3a0`/`#34d399` 並存の解消を固定） |
| TK-U-08 | 先頭4色の色相分散 | idx0-3 の hex | 4 つすべて相異なる（青/橙/緑/ピンク） |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| （なし） | MetricChart.test.tsx | exact hex を assert していない | 変更不要 | 既存 test は色順非依存。リグレッションとして全 green を維持確認するのみ |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| （なし） | — | — |

## 4. リグレッション強化

- `MetricChart.test.tsx` 全ケース green を維持（series 数 / マージ / 凡例 / 空表示）。
- TS-U-37（1 series wrap、idx0 色）は idx0 を青据置にしたため意味的に不変。

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| （なし） | — | — | パレットは純定数、mock 不要 |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承（tokens.ts は定数 + 1 関数で容易に 100%） |
| 分岐 | 70% | 既存継承 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:revise |
