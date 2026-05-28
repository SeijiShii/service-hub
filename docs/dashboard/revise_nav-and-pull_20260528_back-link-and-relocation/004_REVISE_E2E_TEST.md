# dashboard E2E テスト計画（戻る link + 「今すぐ pull」を dashboard へ relocation）

> **入力**: 001、既存 `../../004_dashboard_E2E_TEST.md`
> **最終更新**: 2026-05-28

---

## 1. 変更 UC シナリオ

### UC-LU1 + UC-FP1 (合流): dashboard で鮮度確認 → 即 pull
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| E-NAV-PULL-1 | Clerk 認証済、サービス 1 件以上登録済 | (1) `/` を開く (2) ヘッダの「最終更新」「今すぐ pull」を視認 (3) ボタン押下 (4) 実行中表示 → 完了後サマリ表示 | force-pull が走り、新スナップショットで「最終更新」が現在時刻に更新される |

### UC (navigation): /admin から / へ戻る
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| E-NAV-BACK-1 | Clerk 認証済 | (1) `/` ヘッダの「管理」を click → /admin に遷移 (2) /admin ヘッダの「← ダッシュボード」を click | `/` に戻り dashboard が表示される (双方向 navigation 確立) |

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| UC-LU1 単独 | E-LU1-REG | 最終更新表示が force-pull 配置後も崩れず正しい JST / 相対時間で表示 |
| UC (admin CRUD) | E-CRUD-REG | /admin で services 登録/編集/退役が back-link 追加後も正しく動作 |
| UC-FP1 単体 | E-FP1-REG | /admin に force-pull がもう無いこと (移転確認) |

## 3. 移行検証シナリオ
N/A (DB 移行なし)。

## 4. 環境要件差分
| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| Clerk 認証 | 必須 | 必須 | 変更なし |
| live キー | 必須 (production deploy) | 必須 | 変更なし |
| サンプル services | 1 件以上 (hana-memo) | 1 件以上 | force-pull の結果検証に必要 |

## 5. 期待 KPI
| 指標 | 目標 |
|---|---|
| 「今すぐ pull」押下 → 結果サマリ表示までの時間 | ≤ 30 秒 (現サービス数 1 件) |
| back-link click → / 描画 | ≤ 500ms (SPA route) |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
