# feedback-inbox 単体テスト計画

> **入力**: `./001_feedback-inbox_SPEC.md`, `./002_feedback-inbox_PLAN.md`
> **最終更新**: 2026-06-18

---

## 1. テストケース一覧

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U-01 | `FeedbackItem`/`FeedbackResponse` 型 | 最小固定 + extra 構造 | 型コンパイル成功 |
| U-02 | `upsertFeedbackItems` | 新規 3 件 | feedback_items に 3 行 |
| U-03 | `upsertFeedbackItems` (冪等) | 同 (slug, externalId) を再投入 | 行数不変 (1 行のまま、上書き) |
| U-04 | `listFeedback` (フィルタなし) | 複数サービスのデータ | createdAt 降順、limit=200 |
| U-05 | `listFeedback` (service フィルタ) | `service=hana-memo` | 該当 slug のみ |
| U-06 | `listFeedback` (kind フィルタ) | `kind=bug` | bug のみ |
| U-07 | `listFeedback` (since フィルタ) | `since=<30d前>` | 期間内のみ |
| U-08 | `fetchFeedback` | 正常 FeedbackResponse (mock) | FeedbackItem[] (検証通過分) |
| U-09 | `inbox.ts` claim テンプレ生成 | 1 item | サービス名/kind/本文を含む claim 文字列 |
| U-10 | `api/feedback/inbox` ハンドラ | 認証 OK + データ | 200 + `{items, services}` |
| U-11 | runner 統合 | service-info + feedback 両方 mock | metrics と feedback の両方が永続化 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-20 | `fetchFeedback` | 404 (producer 未実装) | `[]` + エラー記録 ("feedback:404")、throw しない |
| U-21 | `fetchFeedback` | タイムアウト | `[]` + "feedback:timeout" |
| U-22 | `fetchFeedback` | 401 (シークレット不一致) | `[]` + "feedback:401" |
| U-23 | `fetchFeedback` | 不正スキーマ (items が配列でない) | `[]` + "feedback:badschema"、stderr 警告 |
| U-24 | `fetchFeedback` | item.kind 未知値 | その item skip、他 item は通過 |
| U-25 | `fetchFeedback` | item.createdAt 不正 | その item skip |
| U-26 | `api/feedback/inbox` | 未認証 (requireSeiji throw) | 401 `{error:"unauthorized"}` |
| U-27 | runner | 1 サービスの feedback pull が throw | 他サービスは継続 (per-service try/catch) |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-30 | `fetchFeedback` body length | body = 5000 字 (cap 4000 超) | 4000 字に切り詰め + 警告 |
| U-31 | `listFeedback` limit | items 0 件 | `[]` (空状態) |
| U-32 | `fetchFeedback` items | items 空配列 | `[]` (正常、エラーなし) |
| U-33 | `FeedbackResponse` 後方互換 | nextCursor / extra なし | パース成功 (任意フィールド) |

## 2. Mock 方針

| 対象 | 方針 | 理由 |
|---|---|---|
| `safeFetch` (HTTP) | モック (deps 注入) | 実 HTTP を打たない、producer レスポンスを固定 |
| DB (Neon) | pglite (`@electric-sql/pglite`) | 既存 db テストと同方式、実 Neon 不要 |
| Clerk 認証 | `getAuthFromRequest` / `requireSeiji` をモック | 401/200 path を制御 |
| 時刻 (createdAt/since 比較) | 固定値注入 (`Date.now()` を引数化済の chartPeriod 流用) | 再現性 |

## 3. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行カバレッジ | 80% | concept から継承 |
| 分岐カバレッジ | 70% | concept から継承 (検証分岐が多いので重点) |

## 4. 既存ユーティリティ依存
- `src/providers/fetch.ts` `safeFetch` (SSRF/timeout/redirect)
- `src/db/testdb.ts` (pglite テスト DB セットアップ)
- `src/features/dashboard/chartPeriod.ts` `parsePeriod` / `periodToSinceIso` (期間フィルタ流用)
- `src/auth` `requireSeiji` / `getAuthFromRequest`

## 5. テスト実行環境
- フレームワーク: vitest (`npm test`)
- 並列実行: ✅ (既存設定)
- DB テスト: pglite in-memory

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-18 | 初版作成 | /flow:feature |
