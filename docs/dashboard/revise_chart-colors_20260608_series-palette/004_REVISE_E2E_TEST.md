# dashboard E2E テスト計画（chart 線色パレットのバリエーション拡充）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md`, 既存 `../004_dashboard_E2E_TEST.md`, `../103_dashboard_E2E_REPORT.md`
> **最終更新**: 2026-06-08

---

## 1. 変更 UC シナリオ

### UC: dashboard 上部 chart の色分離（少数 service）
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| CC-E2E-01 | service 2〜3 件のデータ有 | dashboard 表示 → chart の各 `<path>` (recharts Line) の `stroke` を取得 | 各 line の stroke が相異なる。先頭 2 本に暖色（橙系 `#fb923c`）と寒色（青 `#5b9cf5`）が含まれ「青と緑だけ」でない |

> jsdom/headless で recharts svg の stroke が完全に render されない場合は、
> 単体（tokens.test.ts）で色不変条件を担保し、E2E は「chart が描画され凡例が出る」までを確認する。

## 2. リグレッションシナリオ（既存 UC、重要度高）

| UC | シナリオ ID | 確認観点 |
|---|---|---|
| dashboard chart 描画 | CC-E2E-R1 | 2 chart（ユーザー数 / 収益¥）が描画され、空時「データなし」が出る（chart-ux 集約を維持） |
| 共有 X 軸 | CC-E2E-R2 | 期間セレクタ（全期間/30日/7日）と共有時間軸が従来どおり動く |
| 凡例 | CC-E2E-R3 | 各 service 名が Legend に表示される（色は補助、名前で識別可能） |

## 3. 移行検証シナリオ（マイグレーションある時）

該当なし（マイグレーション無し）。

## 4. 環境要件差分

| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| （なし） | — | — | 環境変更なし |

## 5. 期待 KPI

| 指標 | 目標 |
|---|---|
| E2E green | 既存 103 件 + 新規シナリオすべて green |
| リグレッション | chart-ux（2 chart 集約・期間・共有軸）を破壊しない |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:revise |
