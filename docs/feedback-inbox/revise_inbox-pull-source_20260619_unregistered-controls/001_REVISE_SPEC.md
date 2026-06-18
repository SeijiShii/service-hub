# feedback-inbox 変更仕様書（無登録 shipyard pull + インボックス操作導線）

> **改修種別**: 機能拡張 (additive)
> **issue / slug**: inbox-pull-source
> **基準 SPEC**: `../001_feedback-inbox_SPEC.md`
> **最終更新**: 2026-06-19
> **タグ**: feature, auth-required

---

## 1. 変更概要

3 つの additive 改修を 1 イシューに束ねる。いずれも運営者が `/feedback` インボックスで shipyard 等のメッセージを「登録の手間なく・その場で取り込んで」確認できるようにする導線改善:

1. **無登録 feedback ソース**: 環境変数 `HUB_FEEDBACK_SOURCES` で定義した外部ソース (shipyard 等) を、`services` レジストリ登録なしで feedback pull 対象に加える。
2. **戻る導線**: インボックスからホーム (`/`) へ戻るナビリンクを追加。
3. **その場 pull**: インボックス内に「今すぐ pull」ボタン (dashboard と同じ `POST /api/admin/collect` → 取り込み後 inbox 再取得) を追加。

破壊変更なし。`HUB_FEEDBACK_SOURCES` 未設定時は現状と完全同一挙動。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC-pull | feedback pull 対象 = `services` 登録済み active サービスのみ | 上記 + `HUB_FEEDBACK_SOURCES` で定義した無登録ソース | shipyard を provider 設定込みの本登録なしで取り込みたい (claim C20260618-001 §5 を「登録なし」に supersede) |
| UC-inbox-nav | インボックスにナビゲーションなし (URL 直叩き/ブラウザ戻るのみ) | ヘッダに「ホーム」リンク (`/`) | 運営面の回遊性 |
| UC-inbox-pull | pull は dashboard `/` の force-pull のみ | インボックス内にも「今すぐ pull」 | メッセージ確認画面で完結 (画面遷移なしで最新取り込み) |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| env `HUB_FEEDBACK_SOURCES` | 無 | JSON 配列 `[{slug,name,url}]` を追加 (任意) | 互換 (未設定で従来動作) |
| feedback pull の対象リスト | `loadServices(db,{onlyActive})` | 上記 + `parseFeedbackSources(env)` をマージ (slug 重複は registered 優先) | 互換 (追加分のみ) |
| `/api/admin/collect` レスポンス | `{...run, feedback}` | 変更なし (ソース数が増えるだけ) | 互換 |
| `/feedback` 画面 | フィルタ + 一覧 | + ホームリンク + 「今すぐ pull」ボタン | 互換 (additive) |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `feedback_items` | 変更なし (無登録ソースも `serviceSlug` で既存テーブルに upsert) | **不要** |
| `services` | 変更なし (無登録ソースは登録しない) | **不要** |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| feedback ソース URL | registry の `publicUrl` (isSafePublicUrl, SSRF 予防) | 同等。`HUB_FEEDBACK_SOURCES` の各 url も `isSafePublicUrl` で検証、slug は `/^[a-z0-9-]+$/` |
| 不正 env エントリ | — | parse 時に skip + `console.warn` (1 件不正で全体を止めない、pull の per-source 方針に整合) |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| feedback-inbox UI (`FeedbackInboxView/Page`) | 中 | ホームリンク + pull ボタン追加 |
| collection (`feedbackRunner` 配線) | 中 | pull 対象リストに env ソースをマージ |
| providers/feedback | 低 | 無改修 (合成 `ServiceDescriptor` をそのまま受ける) |
| registry | なし | 登録経路は不変 |
| dashboard | なし | 既存 force-pull は不変 |
| cross-repo shipyard | なし (相手は実装済 `/api/hub/feedback`) | HUB は pull のみ、相手側変更不要 |

## 4. 後方互換性

- **互換維持**: ✅
- `HUB_FEEDBACK_SOURCES` 未設定 = 従来挙動 (registered のみ pull)。
- 型変更・破壊変更なし。`feedback_items` スキーマ不変。
- 無登録ソースの `serviceSlug` が将来本登録された場合も upsert 冪等で衝突なし (registered 優先 dedup)。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅
- **DB マイグレーションのロールバック**: 無 (DB 変更なし)
- **手順**: コード revert。あるいは `HUB_FEEDBACK_SOURCES` を空/削除すれば無登録 pull のみ即無効化 (UI 追加分はコード revert)。取り込み済み `feedback_items` 行は残るが害なし (運営者閲覧データ)。

## 6. リリース戦略

- **方式**: 一括
- **フィーチャーフラグ名**: 不要 (`HUB_FEEDBACK_SOURCES` の設定有無自体が有効化スイッチ)
- **ロールアウト計画**:
  1. service-hub に本改修をデプロイ (UI + env マージ配線)。
  2. Vercel 環境変数に `HUB_FEEDBACK_SOURCES=[{"slug":"shipyard","name":"Shipyard","url":"https://givers.work"}]` を設定 (URL は実値で確定)。
  3. インボックスの「今すぐ pull」で shipyard メッセージ取り込みを即確認。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- **UC-pull (拡張)**: 手動 (`/api/admin/collect`) / cron (`/api/cron/collect`) いずれの feedback pull も、`registered active services ∪ HUB_FEEDBACK_SOURCES` を対象に `fetchFeedback` を実行。各ソース失敗は per-source skip (既存方針)。
- **UC-inbox-nav**: `/feedback` ヘッダの「ホーム」リンク → `/`。
- **UC-inbox-pull**: 「今すぐ pull」押下 → `POST /api/admin/collect` (credentials include) → 成功で inbox を refetch し最新メッセージを反映。実行中は disabled + 「実行中…」、結果/エラーを簡易表示。

### 7.2 入出力（新仕様）
- `HUB_FEEDBACK_SOURCES` (env, 任意): JSON 文字列。`Array<{ slug: string; name: string; url: string }>`。
  - `slug`: `/^[a-z0-9-]+$/`。`name`: 非空。`url`: `isSafePublicUrl` (https + 公開ホスト + ≤1024 chars)。
  - 各エントリは合成 `ServiceDescriptor` (`status:"active"`, `providers:{}`) に変換され feedback pull のみに使用 (metrics 収集対象外)。
  - 不正 JSON 全体 → 空配列 + warn。不正エントリ単体 → skip + warn。

### 7.3 データモデル（新仕様）
変更なし。無登録ソースの取り込み行も `FeedbackItemRow` (`serviceSlug = ソースの slug`) として `feedback_items` に冪等 upsert。

### 7.4 バリデーション・エラー（新仕様）
§2.4 / §7.2 の通り。SSRF/secret は既存 `safeFetch` + `HUB_SERVICE_INFO_SECRET` をそのまま継承。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- **連携 (cross-repo)**: shipyard `GET /api/hub/feedback` を pull (O67 consumer)。形状は相手 SoT 実装済み (Step 2.1.6 ディスカバリ、AI_LOG D20260619-002)。HUB は consumer のみ、相手側変更不要。
- **セキュリティ**: 無登録ソースも `isSafePublicUrl` + `HUB_SERVICE_INFO_SECRET` Bearer。秘密はレジストリ同様 env にのみ存在 (O25 秘密ゼロ化と整合)。
- **pull ボタン認可**: `/api/admin/collect` は `requireSeiji` ゲート内 (既存)。インボックス自体も Clerk ゲート内。

## 8. タグ別追加項目
- **auth-required**: インボックス + pull ともに既存 Clerk / requireSeiji ゲートを継承。新たな公開面なし。

## 9. 未決事項

> 現時点で論点なし (2026-06-19)。`HUB_FEEDBACK_SOURCES` の shipyard URL 実値 (`https://givers.work` 想定) はデプロイ時の env 設定で確定 (コード/設計の論点ではない)。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-19 | 初版作成 | /flow:revise |
