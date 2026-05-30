# dashboard E2E テスト計画（上部チャートをビジネス指標化）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.1, 既存 `../../004_dashboard_E2E_TEST.md` + e2e/dashboard.spec.ts
> **最終更新**: 2026-05-30

---

## 1. 変更 UC シナリオ

### UC DA-UC4: 上部 chart（ビジネス4枚化）
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| BC-E2E-01 | fixture charts = 4 件 (mau/revenue/cost/profit、label 付き) | dashboard `/` を開く | 上部に 4 chart。見出しが「ユーザー数」「課金額」「コスト」「採算」。`chart-up` / `chart-db_storage_bytes` が**無い** |
| BC-E2E-02 | revenue/cost 時系列あり service | 同上 | 採算(profit) chart に revenue−cost の折れ線が出る |
| BC-E2E-03 | revenue 未申告 service のみ | 同上 | 課金額/コスト/採算 chart が「データなし」、ユーザー数は mau があれば表示 |

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| DA-UC1 一覧 status 列 | BC-E2E-R1 | 一覧の status 列（StatusDot、down/up）が従来通り表示（up を chart から外しても status 列は不変） |
| DA-UC1 一覧 | BC-E2E-R2 | 最終デプロイ列（last-deploy-col）含む既存列が不変 |
| DA-UC4 chart | BC-E2E-R3 | 空データ fallback「データなし」が 4 枚で機能 |
| service-detail | BC-E2E-R4 | service-detail の chart が従来通り（MetricChart label 未指定 fallback、崩れない） |

## 3. 移行検証シナリオ
なし（DB マイグレーション不要）。

## 4. 環境要件差分
| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| e2e/fixtures.ts charts | mau 等 3 件 | mau/revenue/cost/profit 4 件 + label、revenue/cost 時系列を含む fixture に更新 | 4 chart + profit 検証 |
| visual snapshot | dashboard-happy.png（3 chart） | 再生成（4 ビジネス chart）。ユーザー承認 | chart 構成変更 |

## 5. 視覚確認（design O34）
- 4 chart の見出しが日本語で正しく表示、レイアウト崩れなし。
- 採算 chart に負値（赤字）が出る場合の y 軸表示確認。

## 6. 期待 KPI
| 指標 | 目標 |
|---|---|
| E2E 主要シナリオ | 全 green |
| 視覚リグレッション | レイアウト崩れなし |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-30 | 初版作成 | /flow:revise |
