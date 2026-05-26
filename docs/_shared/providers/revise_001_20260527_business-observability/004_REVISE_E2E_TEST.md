# E2E テスト計画（business-observability）

> **入力**: `./001_REVISE_SPEC.md`, concept §1.1 UC, 既存 dashboard/service-detail E2E
> **最終更新**: 2026-05-27
> **実行**: ローカル headless（route-mock API、Class A）。`/flow:e2e` が担当。

## 1. 変更 UC シナリオ

### UC: ダッシュボードで採算 + 離脱率を一覧（Phase A/B）
| シナリオ ID | 前提（mock API） | 操作 | 期待 |
|---|---|---|---|
| BO-E1 | summary に採算（黒字/薄利/赤字）+ 離脱率を含む VM | ダッシュボードを開く | 各サービス行に採算バッジ + 離脱率が表示 |
| BO-E2 | 一部サービスがメトリクス未申告 | 同上 | 未申告は「データなし」表示、レイアウト崩れなし |

### UC: サービス詳細で決済ファネル（Phase B/C）
| シナリオ ID | 前提 | 操作 | 期待 |
|---|---|---|---|
| BO-E3 | detail VM に funnel（started/completed/card_failed）+ 収益/AIコスト時系列 + 1/2/3ヶ月見込み | サービス詳細を開く | 全体離脱率 + カード失敗率 + 収益/コストグラフ + 見込みが表示 |

### UC: コストシミュレーション（Phase D）
| シナリオ ID | 前提 | 操作 | 期待 |
|---|---|---|---|
| BO-E4 | cost-sim API が account 別 無料枠%・上限到達予測・格上げ提案を返す | コストシミュレーションビューを開く | provider アカウント別に 無料枠% + 到達予測 + 提案(keep/upgrade/consolidate/sunset) が表示 |
| BO-E5 | pricing が stale | 同上 | 「料金情報が古い可能性」+ 更新提案の表示 |

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| ダッシュボード基本表示 | BO-RE1 | 採算追加後も稼働/利用/コスト/エラーの既存表示が崩れない |
| サービス詳細既存グラフ | BO-RE2 | ファネル追加後も既存時系列グラフが表示される |
| 認可ゲート | BO-RE3 | cost-sim/採算 API も requireSeiji で 401（未認証）を維持（fix_001 の回帰防止と整合） |

## 3. 移行検証シナリオ
なし（DB マイグレーションなし）。

## 4. 環境要件差分
- 既存 Playwright + route-mock を踏襲。cost-sim API のモックレスポンス（account 別集約 + 提案）を追加。
- 実 Stripe/OpenAI は不要（service-info 自己申告 mock で完結、no-key）。

## 5. 期待 KPI
| 指標 | 目標 |
|---|---|
| 追加シナリオ green | BO-E1〜E5 + リグレッション全 pass |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成 | /flow:revise |
