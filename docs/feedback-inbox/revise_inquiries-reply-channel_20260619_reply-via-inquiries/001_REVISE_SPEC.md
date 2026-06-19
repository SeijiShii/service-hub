# feedback-inbox 変更仕様書（inquiries 消費で返信導線）

> **改修種別**: 機能拡張 (additive)
> **issue / slug**: inquiries-reply-channel
> **基準 SPEC**: `../001_feedback-inbox_SPEC.md`
> **最終更新**: 2026-06-19
> **タグ**: feature, auth-required

---

## 1. 変更概要

無登録 feedback ソース (`HUB_FEEDBACK_SOURCES`) に **endpoint 種別** (`kind: "feedback" | "inquiries"`、既定 `feedback`) を追加し、`kind:"inquiries"` のソースは shipyard の `GET /api/hub/inquiries` を pull する。inquiries は **email(生・返信チャネル) + adminUrl(Clerk ガード deep-link) + subject** を含み、これらを `feedback_items.context` (jsonb) に取り込んで運営者インボックスに**返信導線**（メールで返信 / shipyard admin で返信）を表示する。標準 `/api/hub/feedback` ソース (scrubbed、email なし) は完全後方互換。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC-pull | 全ソース標準 `/api/hub/feedback` (scrubbed、email なし) を pull | `kind:"inquiries"` ソースは `/api/hub/inquiries` を pull し email/adminUrl/subject を取り込む | 標準 O66 は email を scrub するため返信不能だった |
| UC-reply (新) | （返信手段なし、本文のみ） | inbox 各 item に「メールで返信」(mailto:) + 「shipyard で返信」(adminUrl) を表示 (該当時のみ) | 運営者が問い合わせに返信できる |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| env `HUB_FEEDBACK_SOURCES` | `[{slug,name,url}]` | `[{slug,name,url,kind?}]` (kind 省略=feedback) | 互換 (省略時従来同一) |
| pull 先 | 全ソース `${origin}/api/hub/feedback` | kind=inquiries は `${origin}/api/hub/inquiries` | 互換 (kind 指定時のみ分岐) |
| `/api/feedback/inbox` VM | items に context なし想定 | items の `context` に `{email?, adminUrl?, subject?}` (inquiries 由来) | 互換 (additive、Clerk ゲート内のみ送出) |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `feedback_items` | email/adminUrl/subject を**既存 `context` jsonb** に格納 (新カラムなし) | **不要** |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| inquiries response | — | `{schemaVersion:number, items:array}` を要求。item は id/body/createdAt 必須、email/adminUrl/subject は任意で検証 (型不一致は該当フィールドのみ skip) |
| source kind | — | `kind` は `"feedback"|"inquiries"` のみ。未知値は skip + warn (既定 feedback) |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| providers (新 inquiries adapter) | 高 | `/api/hub/inquiries` parse → FeedbackItemRow (context.email/adminUrl/subject) |
| collection (feedbackSources / runner 配線) | 中 | source kind 追加、kind 別 fetch dispatch |
| feedback-inbox UI | 中 | 返信導線 (mailto / adminUrl) を context から表示 |
| feedback_items DB | 低 | context jsonb に格納 (スキーマ不変) |
| cross-repo shipyard | なし | inquiries は実装済 (HUB は pull のみ) |

## 4. 後方互換性

- **互換維持**: ✅
- source `kind` 省略 = `feedback` = 従来 pull。standard ソース・registered services は無影響。
- `context` は既存列、additive。email/adminUrl/subject 不在の item は返信導線を出さないだけ。
- 型変更・破壊変更・DB スキーマ変更なし。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅
- **DB マイグレーションのロールバック**: 無 (DB 変更なし)
- **手順**: code revert。あるいは shipyard ソースの `kind` を `inquiries`→`feedback` (or env 削除) で標準 pull に戻す。取り込み済みの context.email は残るが Clerk ゲート内で無害。

## 6. リリース戦略

- **方式**: 一括 (22nd deploy 想定)
- **フィーチャーフラグ名**: 不要 (`HUB_FEEDBACK_SOURCES` の `kind` 自体がスイッチ)
- **ロールアウト**: デプロイ後、`HUB_FEEDBACK_SOURCES` の shipyard エントリに `"kind":"inquiries"` を追加 → 「今すぐ pull」で email/adminUrl 付きで取り込み。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- **UC-pull (拡張)**: `loadFeedbackTargets` が各ソースを `{slug,name,url,kind}` で返す。runner は kind 別 adapter で fetch。inquiries adapter は `${origin}/api/hub/inquiries` を `HUB_SERVICE_INFO_SECRET` Bearer で pull。
- **UC-reply (新)**: inbox item の `context.email` があれば `mailto:<email>?subject=Re: <subject>` リンク、`context.adminUrl` があれば「shipyard で返信」リンク (新規タブ) を表示。どちらも認証済み画面 (Clerk ゲート) のみ。

### 7.2 入出力（新仕様）
- inquiries item 検証: `id`(string,必須) / `body`(string,必須) / `createdAt`(ISO,必須) / `kind` は "inquiry" 固定マップ / `email`(string,任意) / `adminUrl`(string,任意、isSafePublicUrl 推奨) / `subject`(string,任意) / `status`(任意)。
- FeedbackItemRow へのマップ: 標準フィールド + `context = { ...(email && {email}), ...(adminUrl && {adminUrl}), ...(subject && {subject}) }`。
- threadToken は**受信しても破棄** (SEC-002、複製しない)。

### 7.3 データモデル（新仕様）
`feedback_items.context` jsonb に `{email?, adminUrl?, subject?}` を格納。`FeedbackItemRow.context?: Record<string, unknown>` 既存型で表現。inbox VM は spread でそのまま client へ (Clerk ゲート内)。

### 7.4 バリデーション・エラー（新仕様）
§2.4 の通り。inquiries endpoint が 401/404/badschema の場合は標準 feedback と同じく per-source skip + error サマリ。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- **連携**: shipyard `GET /api/hub/inquiries` (O67 consumer 拡張)。形状は相手 SoT (inquiries-contract.ts) 実装済 (Step 2.1.6)。
- **SEC (email PII at rest)**: email を HUB Neon `feedback_items.context` に保存。(1) inbox は単一ユーザー Clerk ゲート、(2) producer が返信チャネルとして意図供給 (inquiries-contract: SEC-001 禁止 sink でない)、(3) **threadToken (IDOR キー) は複製しない** (SEC-002)。accepted-as-requirement。`/flow:secure` で再評価可。
- **adminUrl**: Clerk ガード deep-link (秘密でない)。新規タブで開く (`rel="noopener noreferrer"`)。

## 8. タグ別追加項目
- **auth-required**: email/返信導線は Clerk ゲート内 inbox のみ。公開面に email を出さない。

## 9. 未決事項
> 現時点で論点なし (2026-06-19)。email PII at rest は §7.5 で accepted-as-requirement として確定 (ユーザー選択 + producer 契約準拠)。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-19 | 初版作成 | /flow:revise |
