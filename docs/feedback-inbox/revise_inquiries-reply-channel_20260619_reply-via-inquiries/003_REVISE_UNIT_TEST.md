# feedback-inbox 単体テスト計画（inquiries 消費で返信導線）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存テスト
> **最終更新**: 2026-06-19

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| RI-S1 | parseFeedbackSources kind | `[{slug,name,url,kind:"inquiries"}]` | FeedbackSource.kind="inquiries" |
| RI-S2 | parseFeedbackSources kind 既定 | kind 省略 | kind="feedback" |
| RI-S3 | fetchInquiries | inquiries response (email/adminUrl/subject 付き) | FeedbackItemRow[].context = {email,adminUrl,subject}, kind="inquiry" |
| RI-S4 | fetchFromSource dispatch | kind=feedback / kind=inquiries | それぞれ /api/hub/feedback / /api/hub/inquiries を叩く |
| RI-S5 | inbox 返信導線 | item.context.email + adminUrl あり | mailto リンク + 「shipyard で返信」リンク表示 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| RI-E1 | parseFeedbackSources kind | 未知 kind ("foo") | skip + warn (or 既定 feedback、設計どおり) |
| RI-E2 | fetchInquiries | threadToken がレスポンスに含まれる | context に threadToken を**入れない** (破棄、SEC-002) |
| RI-E3 | fetchInquiries | 401/404/badschema | {items:[], error} で skip (throw しない) |
| RI-E4 | fetchInquiries | email/adminUrl/subject 欠落 item | 標準フィールドのみで取り込み、返信導線なし |
| RI-E5 | fetchInquiries | adminUrl が非安全 url | adminUrl を context に入れない (skip)、他は取り込む |
| RI-E6 | inbox 返信導線 | context.email なし | mailto リンク非表示 (回帰: 標準 feedback item) |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| RI-B1 | fetchInquiries | items=[] | {items:[]} (空 graceful) |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| RM-1 | feedbackSources 既存 test | ServiceDescriptor[] 期待 | FeedbackSource[] (kind 付き) 期待 | 型拡張に追従 (挙動は等価、kind=feedback default) |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| (なし) | — | — |

## 4. リグレッション強化
- 既存 feedbackSources / providers/feedback / FeedbackInboxView テスト (409) を全維持。kind 省略 = 従来同一を RI-S2 + 既存スイートで担保。標準 feedback item に返信導線が出ないこと (RI-E6) を確認。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| fetchImpl | feedback shape mock | + inquiries shape mock (email/adminUrl/subject/threadToken 含む) | adapter 検証 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承 (kind dispatch + 任意フィールド検証分岐網羅) |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-19 | 初版作成 | /flow:revise |
