# _shared/providers E2E テスト計画（秘密ゼロ化）

> **入力**: 001_REVISE_SPEC / concept §6 / 既存 collection・dashboard E2E
> **最終更新**: 2026-05-28

---

## 1. 変更 UC シナリオ
本改修は内部 adapter のシークレット経路変更で、新規ユーザー向け UC/画面はなし。

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| collect cron | RP-01 | `/api/cron/collect` 後、service-info を実装したサービスの `mau` が usage_snapshots に保存される（provider="service-info"）。Clerk API は叩かれない |
| ダッシュボード | RP-02 | MAU 列が service-info 由来の値で表示される（metricKey="mau" 不変）。service-info 未実装サービスは MAU 空欄（フォールバックなし、Q1=A） |
| 共通鍵 | RP-03 | HUB env に HUB_SERVICE_INFO_SECRET 設定時、service-info が Bearer 付きで叩かれる |

## 3. 移行検証シナリオ
なし（未運用・データ移行なし）。

## 4. 環境要件差分
| 項目 | 前回 | 今回 |
|---|---|---|
| HUB env | per-service `*_CLERK_SECRET` / `*_HUB_SECRET` | 共通 `HUB_SERVICE_INFO_SECRET` 1 本 |

## 5. 期待 KPI
- 新サービス追加で HUB の `.env` が不変（per-service secret 増分ゼロ）。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
