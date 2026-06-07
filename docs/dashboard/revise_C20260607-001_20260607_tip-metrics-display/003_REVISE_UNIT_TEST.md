# dashboard 単体テスト計画（投げ銭(tip)指標を一覧に表示）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `ServiceRow.test.tsx` / `summary.test.ts`
> **最終更新**: 2026-06-07

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| TIP-U-01 | ServiceRow | `metrics:{ tip_total_yen:{value:100,unit:"jpy"} }` | `[data-tip-yen]` の textContent = `¥100` |
| TIP-U-02 | ServiceRow | `metrics:{ tip_count:{value:1,unit:"count"} }` | `[data-tip-count]` の textContent = `1` |
| TIP-U-03 | ServiceRow | tip_count/tip_total_yen 両方申告 (1 / 100) | 両セルが `1` / `¥100` |

### 1.2 異常系 / 未申告
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| TIP-U-10 | ServiceRow | `metrics:{}`（tip 未申告） | `[data-tip-yen]` = `—`、`[data-tip-count]` = `—` |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| TIP-U-20 | ServiceRow | `tip_total_yen:{value:0}` / `tip_count:{value:0}`（申告ありで 0） | `¥0` / `0`（未申告 `—` と区別、0 は有効値） |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| （なし） | — | — | — | additive のため既存ケースの期待値変更なし |

## 3. 削除テストケース
（なし）

## 4. リグレッション強化

- 既存テスト維持: `ServiceRow.test.tsx` の「既存セル (slug / alerts) は従来通り表示」「最終デプロイカラム」系を維持。
- 追加チェック: thead 列数（10）と各行セル数（10）の整合（`DashboardView.test.tsx` に列数アサート追加、または ServiceRow セル数）。
- `summary.test.ts`: buildDashboard が tip_* を generic に VM へ投影する（`row.metrics.tip_total_yen.value === 100`）ことを確認（VM 層が既に汎用である回帰防止）。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| renderRow ヘルパ | metrics={} 既定 | tip メトリクスを over で注入 | 既存ヘルパ流用、変更なし |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（未申告/0/値あり の 3 分岐をカバー） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-07 | 初版作成 | /flow:revise |
