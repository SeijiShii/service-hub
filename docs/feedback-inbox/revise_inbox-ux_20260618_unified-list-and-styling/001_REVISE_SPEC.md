# feedback-inbox 変更仕様書（インボックス UX — 統合一覧 + スタイル適用）

> **改修種別**: 機能変更 (UI/UX) + リファクタ (styling)
> **issue / slug**: inbox-ux / unified-list-and-styling
> **基準 SPEC**: `../001_feedback-inbox_SPEC.md`
> **最終更新**: 2026-06-18
> **タグ**: feature, auth-required

---

## 1. 変更概要

運営者インボックス `/feedback` を (1) **design-system トークンで全コントロールをスタイル**し (raw 未スタイル `<select>` の解消)、(2) **「全サービスのメッセージを一度に見る統合インボックス」であることを視覚的に明示**する (件数サマリ + per-item サービス強調 + フィルタを二次的な絞り込みに)。一覧の unified 動作 (全サービス全件) は既存実装で成立しているため**機能ロジックは不変**、本改修は presentation 層に閉じる (API/型/DB 不変)。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC1 一覧 | 全件表示はするが、raw select 行が主役で「サービスを選ぶフォーム」に見え、総当たり確認が要る印象。件数の手掛かりなし | **統合インボックスと明示**: 上部に件数サマリ (全 N 件 / kind 別内訳)、各 item にサービスアイコン+名を強調表示し横断スキャンしやすく。フィルタは「絞り込み」として二次配置 | 見落としリスク (総当たり) の解消 = ユーザー要望② |
| UC1 フィルタ | service/kind/period の raw `<select>` (browser default、dark で浮く) | **token スタイルの絞り込みバー**: service=styled select (既定「すべてのサービス」)、kind=segmented chips (すべて/ひとこと/不具合/問い合わせ)、period=styled select。すべて `--surface-raised`+`--border`+`--text` で統一 | 要望① スタイル適用 + 「選択フォーム」感の払拭 |
| UC3 トリアージ | 未スタイル button | token スタイル button (accent 文字 + border) | 要望① |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `GET /api/feedback/inbox` | `{items, services}` | **変更なし** (件数は items から VM で算出、API 不変) | 互換維持 |
| ビューモデル `FeedbackInboxVM` | items + services | **`counts` 追加** (total + kind 別、`buildInboxVM` がクライアント算出) | 互換維持 (additive) |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| (なし) | DB/型/API すべて不変 | **不要** |

### 2.4 バリデーション・エラー変更
変更なし (presentation のみ)。

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/features/feedback-inbox/FeedbackInboxView.tsx` | 高 | styling 全面 + 件数サマリ + フィルタ再構成 (直接対象) |
| `src/features/feedback-inbox/inbox.ts` | 中 | `buildInboxVM` に `counts` 算出を追加 (additive) |
| `src/features/feedback-inbox/FeedbackInboxPage.tsx` | 低 | VM 受け渡しのみ (変更ほぼなし) |
| API / DB / 型契約 (`FeedbackItem` 等) | なし | 不変 (後方互換) |

## 4. 後方互換性
- **互換維持**: ✅ (UI/presentation のみ、API・型・DB 不変)。`FeedbackInboxVM.counts` は additive。

## 5. ロールバック方針
- **コード revert で戻せる**: ✅ (presentation のみ、DB マイグレーションなし)。

## 6. リリース戦略
- **方式**: 一括 (内部単一ユーザーツール、フィーチャーフラグ不要)。次回 deploy (20th 見込み) で反映。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- **UC1 統合インボックス閲覧**: `/feedback` を開くと**全サービスの全 feedback が createdAt 降順で 1 リスト**に表示 (既存動作)。上部に **件数サマリ** 「全 N 件（ひとこと a / 不具合 b / 問い合わせ c）」。各 item は `ServiceIcon` + サービス名を行頭に強調表示 → どのサービスの声か一目で分かり横断スキャン可能 (総当たり不要)。
- **UC1 絞り込み (refinement)**: 絞り込みバーで service / kind / period を任意に絞る。**既定はすべて (= 全サービス・全 kind・直近30日)**。kind は segmented chips でワンタップ切替。絞り込んでも「一覧の部分集合」であることが件数サマリ (絞り込み後の件数) で分かる。
- **UC3 トリアージ**: 各 item の「クレーム文をコピー」(token スタイル button)。

### 7.2 入出力（新仕様）
- API 不変。VM に `counts: { total: number; byKind: Record<FeedbackKind, number> }` を追加 (表示中 items から算出)。

### 7.3 データモデル（新仕様）
変更なし。

### 7.4 バリデーション・エラー（新仕様）
変更なし。空状態は token スタイルの空状態メッセージ (既存維持、styling 改善)。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- **スタイル整合性 (新)**: 全ユーザー向けコントロールが design-system トークン経由 (生値 hex 単独ゼロ、raw browser-default control ゼロ)。dashboard 等 reviewed 画面と視覚的に整合 (CF-20260618-008 #2.6 token-conformance 準拠)。
- 連携: `ServiceIcon`/`StatusDot` 既存共有コンポーネント、`chartPeriod` 既存、design-system トークン (`src/index.css :root`)。

## 8. タグ別追加項目
### 8.1 認可（auth-required）
変更なし (Clerk 単一ユーザーゲート、`requireSeiji`)。

## 9. 未決事項
- 現時点で論点なし (2026-06-18)。kind フィルタの segmented chips vs styled select は実装時に視覚レビューで確定 (どちらも token スタイルなら可、既定 = segmented chips)。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-18 | 初版作成 (統合一覧明示 + token styling) | /flow:revise |
