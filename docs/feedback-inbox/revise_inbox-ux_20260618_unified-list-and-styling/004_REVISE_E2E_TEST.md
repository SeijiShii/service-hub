# feedback-inbox E2E テスト計画（インボックス UX — 統合一覧 + スタイル適用）

> **入力**: `./001_REVISE_SPEC.md`, 既存 `../../004_feedback-inbox_E2E_TEST.md` + `e2e/feedback-inbox.spec.ts`
> **最終更新**: 2026-06-18
> **実行**: `/flow:e2e feedback-inbox` (route-mock、Clerk bare build)

---

## 1. 変更 UC シナリオ

### UC1: 統合インボックス + 件数サマリ
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| RE-UC1-S1 | 複数サービスの feedback mock | `/feedback` を開く | 全サービスの item が 1 リスト表示 + **件数サマリ「全 N 件」**が見える + 各 item にサービス名表示。視覚 snapshot (token スタイル) |
| RE-UC1-S2 | 同上 | **kind segmented chips「不具合」**をクリック | bug のみに絞り込み + 件数サマリが絞り込み後件数に更新 |
| RE-UC1-S3 | 同上 | サービス絞り込みを 1 サービスに | そのサービスのみ表示 (絞り込みは refinement、既定は全件) |

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| UC1-S1 | 既存 | 一覧 + kind バッジ + createdAt 降順 (L2-1) が維持 |
| UC1-S4 | 既存 | 空状態メッセージ (styling 更新後も表示) |
| UC1-S3 | 既存 | kind フィルタ refetch が維持 (chips でも動作) |

## 3. 移行検証シナリオ
- (なし — migration なし)

## 4. 環境要件差分
| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| 視覚 baseline | feedback-inbox-list / empty | **更新** (件数サマリ + token 絞り込みバー + chips でレイアウト変化) | styling 改修のため `--update-snapshots` で再生成 (意図的変更) |

## 5. レイアウト・ビジュアル検証 (O34)
- **Level 1 (snapshot)**: ✅ 更新 (list/empty)。token スタイル適用後の baseline。
- **Level 2 (意味的)**: ✅ — L2-1 (createdAt 降順) 維持、件数サマリがリスト上部、絞り込みバーがリストより上、chips の選択状態が視認できる。
- **視覚レビュー (P4.4 #2.6 token-conformance)**: 生値 hex 単独ゼロ / raw 未スタイル control ゼロ / dashboard と視覚整合 を `/flow:design --review-only` で確認。

## 6. 期待 KPI
| 指標 | 目標 |
|---|---|
| シナリオ成功率 | 100% |
| Level 1 snapshot 差分 | 0 (更新後の baseline に対し) |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-18 | 初版作成 | /flow:revise |
