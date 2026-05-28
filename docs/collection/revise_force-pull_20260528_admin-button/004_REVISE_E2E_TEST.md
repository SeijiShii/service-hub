# collection E2E テスト計画（強制プルボタン）

> **入力**: `./001_REVISE_SPEC.md`, 既存 E2E + concept §1.1 UC
> **最終更新**: 2026-05-28
> **基盤**: Playwright（既存 e2e/）。Clerk 認証コンテキスト前提

---

## 1. 変更 UC シナリオ

### UC-FP1: /admin から「今すぐ pull」
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| E-FP-01 | seiji 認証済 / services テーブルに 1 件以上登録 | `/admin` を開く → 「今すぐ pull」ボタンが見える → 押下 | ボタンが disabled+「実行中…」表示 → 完了後に結果サマリ（services_count / errors 件数）が表示される / `/`（ダッシュボード）に最新 snapshot が反映 |
| E-FP-02 | 同上、services 0 件 | 押下 | 200 + services_count=0 のサマリ表示（エラー無し） |
| E-FP-03 | 未認証コンテキスト | `POST /api/admin/collect` 直叩き | 401（フロントから到達不能なので curl で検証） |

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| Vercel Cron `/api/cron/collect` | R-CR-01 | `CRON_SECRET` Bearer 付きで叩いて従来どおり動作（admin endpoint 追加後も既存 cron 経路に影響なし） |
| /admin 既存機能 | R-AD-01 | サービス登録/編集/退役が引き続き動作 |
| ダッシュボード | R-DB-01 | 強制 pull 後にダッシュボードが最新 snapshot を表示 |

## 3. 移行検証シナリオ
なし（マイグレーション不要）。

## 4. 環境要件差分
| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| なし | — | — | UI 追加 + 新エンドポイントのみ、env/インフラ差分なし |

## 5. 期待 KPI
- `/admin` の「今すぐ pull」を押下 → **5〜30 秒以内**に結果サマリが返る（runCollection の所要時間に依存）。
- snapshots が cron を待たずに更新される。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
