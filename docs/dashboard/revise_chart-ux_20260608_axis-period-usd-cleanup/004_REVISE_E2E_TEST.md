# dashboard E2E テスト計画（上部 chart 時間軸統一 + 期間選択 + usd 系 chart 削除）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md`, 既存 `e2e/dashboard.spec.ts`
> **最終更新**: 2026-06-08

---

## 1. 変更 UC シナリオ

### UC: 上部 chart 閲覧（集約 + 軸統一 + 期間選択）
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| E-01 | seiji ログイン済、mau/収益¥ に複数日 snapshot | `/` を開く | chart section に **2 枚のみ**（`chart-mau`, `chart-revenue_total_yen`）。`chart-revenue_month_usd` / `chart-ai_cost_month_usd` / `chart-profit` が **存在しない** |
| E-02 | 同上、複数 chart に点あり | chart section を観察 | 2 枚の chart の X 軸目盛り範囲（左端・右端の時刻ラベル）が**一致**している |
| E-03 | 同上 | 期間セレクタで「7日」を選択 | summary 再取得後、両 chart が直近 7 日窓に同期（軸範囲が縮む）。セレクタ選択状態が「7日」 |
| E-04 | 同上、30 日超のデータあり | 「全期間」を選択 | 両 chart が全データ範囲に拡大、軸は引き続き一致 |
| E-05 | 既定状態 | `/` 初期表示 | 期間は「30日」が選択済（現行挙動維持）、ヘッダ文言「収益・利用の推移」 |
| E-06 | mau/収益とも snapshot 無し | `/` を開く | 各 chart が「データなし」fallback、セレクタは操作可能でクラッシュなし |

## 2. リグレッションシナリオ（既存 UC、重要度高）

| UC | シナリオ ID | 確認観点 |
|---|---|---|
| 一覧テーブル | R-01 | 「採算」列・「収益(¥)」「収益(件)」列が従来通り表示（chart 削除が列に波及しない） |
| service-detail | R-02 | service-detail の単体 metric chart が従来通り描画（MetricChart domain 未指定パス、回帰なし） |
| force-pull | R-03 | 「今すぐ pull」→ summary refetch → chart が新スナップショットで更新（period 選択を維持） |
| 認可 | R-04 | 未ログインで `/api/dashboard/summary?period=7d` が 401/403（period 追加が認可を弱めない） |

## 3. 移行検証シナリオ（マイグレーションある時）
- 該当なし（DB 変更・データ移行なし）。

## 4. 環境要件差分

| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| fixtures | mau/up/db_storage 等 + revenue 系 | mau + revenue_total_yen に複数日分の点を用意（軸統一・期間切替の検証用） | 2 chart 集約 + 期間/軸シナリオ |
| 既存 baseline | charts 5 枚想定の visual baseline | 2 枚へ baseline 再生成（ユーザー承認の上） | chart 枚数変更 |

## 5. 期待 KPI

| 指標 | 目標 |
|---|---|
| dashboard E2E | 全シナリオ green（E-01〜06 + R-01〜04） |
| flaky | 0（時刻依存は fixtures の固定 capturedAt で排除） |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:revise |
