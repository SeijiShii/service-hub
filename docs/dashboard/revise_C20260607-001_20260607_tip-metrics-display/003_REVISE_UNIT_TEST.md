# dashboard 単体テスト計画（投げ銭(tip)指標を一覧に表示）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `ServiceRow.test.tsx` / `summary.test.ts`
> **最終更新**: 2026-06-07

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| REV-U-01 | ServiceRow | `metrics:{ revenue_total_yen:{value:100,unit:"jpy"} }` | `[data-revenue-yen]` = `¥100` |
| REV-U-02 | ServiceRow | `metrics:{ revenue_count:{value:1,unit:"count"} }` | `[data-revenue-count]` = `1` |
| REV-U-03 | ServiceRow | revenue_count/revenue_total_yen 両方申告 (1 / 100) | 両セルが `1` / `¥100` |
| REV-AD-01 | service-info adapter | metrics[] に旧 `tip_count:1` / `tip_total_yen:100` | canonical `revenue_count:1` / `revenue_total_yen:100` に正規化して emit |
| REV-AD-02 | service-info adapter | metrics[] に新 `revenue_count:3` / `revenue_total_yen:500` | そのまま native emit |
| REV-DA-01 | buildDashboard | revenue_* snapshot | `ServiceRowVM.metrics.revenue_*` に generic 投影 |

### 1.2 異常系 / 未申告
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| REV-U-10 | ServiceRow | `metrics:{}`（収益 未申告） | `[data-revenue-yen]` = `—`、`[data-revenue-count]` = `—` |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| REV-U-20 | ServiceRow | `revenue_total_yen:{value:0}` / `revenue_count:{value:0}`（申告ありで 0） | `¥0` / `0`（未申告 `—` と区別、0 は有効値） |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| （なし） | — | — | — | additive のため既存ケースの期待値変更なし |

## 3. 削除テストケース
（なし）

## 4. リグレッション強化

- 既存テスト維持: `ServiceRow.test.tsx` の「既存セル (slug / alerts) は従来通り表示」「最終デプロイカラム」系、`adapters.test.ts` の既存 service-info ケースを維持。
- 追加チェック: thead 列数（10）と各行セル数（10）の整合。
- `summary.test.ts`: buildDashboard が revenue_* を generic に VM へ投影することを確認（REV-DA-01、VM 層が汎用である回帰防止）。
- `adapters.test.ts`: 既存 mau / active_users_7d 等の素通りが壊れていないこと（alias は tip_* のみ写像）。

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
