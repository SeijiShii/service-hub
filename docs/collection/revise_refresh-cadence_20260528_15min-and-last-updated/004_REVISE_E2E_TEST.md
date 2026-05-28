# collection E2E テスト計画（15 分 cron + 最終更新表示）

> **入力**: 001/002, 既存ダッシュボード E2E
> **最終更新**: 2026-05-28

---

## 1. 変更 UC シナリオ

### UC-RC1: 15 分自動 pull → 最終更新が更新される
| シナリオ ID | 前提 | 操作ステップ | 期待 |
|---|---|---|---|
| E-RC-01 | 本番デプロイ済 / GH Actions Secret 登録済 | GH Actions `cron-collect.yml` を workflow_dispatch で手動実行 | Actions 画面で run 成功 + ダッシュボードの「最終更新」が直後の時刻に更新 |
| E-RC-02 | 同上 | 15 分待つ | 次の `*/15` 境界で自動 run 成功、最終更新が再度更新 |

### UC-LU1: ダッシュボード最終更新表示
| E-LU-01 | run 履歴あり | `/` を開く | ヘッダに「最終更新: YYYY-MM-DD HH:MM (xx 分前)」表示 |
| E-LU-02 | run 履歴なし（services 0 件で 1 度も走らず） | `/` を開く | 「未収集」表示 |
| E-LU-03 | 最新 run が failed | `/` を開く | 警告色 + status 表示 |

## 2. リグレッションシナリオ
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| `/api/cron/collect` エンドポイント | R-CR-01 | CRON_SECRET Bearer で叩いて従来どおり動作（GH Actions も同じ経路） |
| ダッシュボード既存表示 | R-DB-01 | サービス一覧・最新 snapshot 表示が不変 |
| `/admin` 強制プル | R-AD-01 | 直前 revise で追加した「今すぐ pull」ボタンが引き続き動作（同じ runCollection 経由） |

## 3. 移行検証シナリオ
なし（マイグレーション不要、設定移行のみ）。

## 4. 環境要件差分
| 項目 | 前回 | 今回 |
|---|---|---|
| 自動 pull の実行元 | Vercel Cron | GH Actions cron（GitHub Secrets に CRON_SECRET 必須） |
| `vercel.json` | `crons` あり | `crons` なし |

## 5. 期待 KPI
- 自動 pull 頻度: **24 時間に 1 回 → 15 分に 1 回**（達成目標）
- ダッシュボードに「最終更新」が常時表示（達成目標）

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
