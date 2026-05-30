# dashboard E2E テスト計画（last_deploy_at をチャートから外し一覧に日時カラム追加）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.1, 既存 `../../004_dashboard_E2E_TEST.md`
> **最終更新**: 2026-05-30

---

## 1. 変更 UC シナリオ

### UC DA-UC4: 上部 chart（3 枚化）
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| LDC-E2E-01 | snapshots に up/mau/db_storage_bytes/last_deploy_at あり | dashboard `/` を開く | 上部 chart section に **3 枚のみ**（up / mau / db_storage_bytes）。last_deploy_at の chart が**無い** |

### UC DA-UC1: 一覧に最終デプロイ日時カラム
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| LDC-E2E-02 | あるサービスに last_deploy_at snapshot あり | dashboard `/` を開く | テーブルに「最終デプロイ」列が存在し、対象行に JST 日時（`YYYY-MM-DD HH:MM`）が表示される |
| LDC-E2E-03 | あるサービスに last_deploy_at snapshot 無し | dashboard `/` を開く | 当該行の「最終デプロイ」セルが `—` |

## 2. リグレッションシナリオ（既存 UC、重要度高）

| UC | シナリオ ID | 確認観点 |
|---|---|---|
| DA-UC1 一覧 | LDC-E2E-R1 | 既存列（status/service/MAU/採算/離脱率/errors/alerts）が従来通り表示、値整形・状態色が不変 |
| DA-UC4 chart | LDC-E2E-R2 | 残る 3 chart の描画・空データ fallback（「データなし」）が従来通り |
| DA-UC1 empty | LDC-E2E-R3 | rows=0 のとき empty-state 表示 + 上部 chart section は出る（既存挙動維持） |

## 3. 移行検証シナリオ（マイグレーションある時）

なし（DB マイグレーション不要）。

## 4. 環境要件差分

| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| Playwright / headless スクショ | 既存 | 変更なし | 表示変更のみ |

## 5. 視覚確認（design O34）

- chart が 3 枚になりレイアウト崩れがないか headless スクショで確認。
- テーブルに列追加した結果、横幅オーバーフロー・折返しが起きないか確認（列が増えるため特に確認）。

## 6. 期待 KPI

| 指標 | 目標 |
|---|---|
| E2E 主要シナリオ | 全 green |
| 視覚リグレッション | レイアウト崩れなし |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-30 | 初版作成 | /flow:revise |
