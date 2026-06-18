# feedback-inbox E2E テスト計画（無登録 shipyard pull + インボックス操作導線）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.1, 既存 `../../004_feedback-inbox_E2E_TEST.md`
> **最終更新**: 2026-06-19

---

## 1. 変更 UC シナリオ

### UC-inbox-nav: ホームへ戻る
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| RE-N1 | Clerk 認証済みで `/feedback` 表示 | ヘッダ「ホーム」リンクをクリック | `/` (dashboard) へ遷移 |

### UC-inbox-pull: その場 pull
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| RE-P1 | `/feedback` 表示、`/api/admin/collect` を成功 mock (新 feedback 1 件含む) | 「今すぐ pull」クリック | 実行中は disabled→完了後 inbox が refetch され新メッセージが一覧に出現 |
| RE-P2 | `/api/admin/collect` を 401 mock | 「今すぐ pull」クリック | エラー (`http_401`) 表示、一覧は不変 |

### UC-pull (env ソース取り込み)
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| RE-P3 | `HUB_FEEDBACK_SOURCES` に shipyard mock、`/api/hub/feedback` を items 返却 mock | pull 実行 | shipyard 由来メッセージ (serviceName=Shipyard) が一覧に表示 |

## 2. リグレッションシナリオ（既存 UC、重要度高）

| UC | シナリオ ID | 確認観点 |
|---|---|---|
| 一覧表示 | RE-R1 | 既存の横断一覧 + 件数サマリが従来通り表示 |
| フィルタ | RE-R2 | サービス/種別/期間フィルタが従来通り動作 |
| 空状態 | RE-R3 | env 未設定 + データ無で「まだ届いていません」 |
| 認証 | RE-R4 | 未認証で `/feedback` が gate される (既存) |

## 3. 移行検証シナリオ（マイグレーションある時）

| シナリオ ID | 移行前データ | 移行後期待状態 |
|---|---|---|
| (なし) | — | DB 変更なし |

## 4. 環境要件差分

| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| env | `HUB_SERVICE_INFO_SECRET` | + `HUB_FEEDBACK_SOURCES` (任意) | 無登録ソース定義 |

## 5. 期待 KPI

| 指標 | 目標 |
|---|---|
| shipyard メッセージ取り込み | pull 後 inbox に表示される |
| 既存導線リグレッション | 0 件 |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-19 | 初版作成 | /flow:revise |
