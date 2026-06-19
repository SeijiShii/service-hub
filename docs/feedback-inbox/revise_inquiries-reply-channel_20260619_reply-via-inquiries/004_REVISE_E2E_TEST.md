# feedback-inbox E2E テスト計画（inquiries 消費で返信導線）

> **入力**: `./001_REVISE_SPEC.md`, 既存 `../../004_feedback-inbox_E2E_TEST.md`
> **最終更新**: 2026-06-19

---

## 1. 変更 UC シナリオ

### UC-reply: 返信導線
| シナリオ ID | 前提 | 操作 | 期待 |
|---|---|---|---|
| RE-R1 | inbox VM に inquiry item (context.email + adminUrl) を mock 返却 | `/feedback` 表示 | 「メールで返信」(mailto:) + 「shipyard で返信」(adminUrl, target=_blank) が表示 |
| RE-R2 | mailto リンク href 検証 | item に email="a@b.com" subject="X" | href が `mailto:a@b.com` を含む |
| RE-R3 | adminUrl リンク | item.context.adminUrl="https://shipyard.../admin/..." | href = adminUrl, rel に noopener |

## 2. リグレッションシナリオ
| UC | シナリオ ID | 確認 |
|---|---|---|
| 標準 item | RE-RR1 | context.email なしの通常 feedback item に返信導線が**出ない** |
| 一覧/フィルタ | RE-RR2 | 既存の一覧・kind chips・件数サマリが従来通り |
| ホーム/pull | RE-RR3 | inbox-pull-source の home link / 今すぐ pull が従来通り |

## 3. 移行検証シナリオ
| シナリオ ID | 移行前 | 移行後 |
|---|---|---|
| (なし) | — | DB 変更なし |

## 4. 環境要件差分
| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| env | HUB_FEEDBACK_SOURCES `[{slug,name,url}]` | + 任意 `kind:"inquiries"` | inquiries pull |

## 5. 期待 KPI
| 指標 | 目標 |
|---|---|
| 返信導線 | inquiry item に email/adminUrl があれば表示 |
| 標準 item 回帰 | 返信導線非表示・既存挙動維持 |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-19 | 初版作成 | /flow:revise |
