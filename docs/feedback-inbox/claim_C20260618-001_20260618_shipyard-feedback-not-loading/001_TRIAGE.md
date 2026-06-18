# クレーム判定レポート

**claim id**: C20260618-001
**判定日**: 2026-06-18
**判定者**: Claude (Opus 4.8) + seiji
**判定**: 仕様検討漏れ / deferred follow-up の未実装 (revise) — ただし **cross-repo 依存で着手前にユーザー判断を要する**

## 1. 三項照合

### 1.1 期待 (Expected)
shipyard の問い合わせ/フィードバックが HUB 運営者インボックスに表示される。

### 1.2 既存仕様 (Spec)
- **concept §6.2 #3**: 「Shipyard の問い合わせはプラットフォーム全体の contact form で **per-service feedback 契約 (標準 `GET /api/hub/feedback`) に乗らない** → **そこだけ専用 adapter** で取り込む (shipyard 側 API 設計 + HUB 側取り込みをセットで)」。
- **feedback-inbox SPEC §8 [論点-FI-4]**: 「Shipyard 専用 adapter (follow-up、本 MVP スコープ外)」。feature 設計時 (D20260618_009) に**ユーザーが「標準のみ (Shipyard は後回し)」を明示選択** → 標準 per-service pull のみ実装、Shipyard adapter は [論点-FI-4] に登録して defer。
- 標準 feedback pull (`src/providers/feedback.ts`): 各 active サービスの `${origin}/api/hub/feedback` を pull するのみ。

### 1.3 現実 (Actual)
- コードベースに **shipyard/contact 専用 adapter なし** (`grep shipyard|contact src/providers src/features/feedback-inbox src/features/collection` → 0 件)。
- 標準 pull は固定パス `/api/hub/feedback` (FIXED_PATH, feedback.ts:27) のみ。shipyard の contact form はこの契約に乗らない別データソース。
- shipyard が HUB の `services` テーブルに登録されていても、`https://givers.work/api/hub/feedback` は存在しない (shipyard は showcase、per-service feedback producer でない) → 404 → graceful skip → `feedback_items` に 0 行。
- → **shipyard の contact メッセージは一度も取り込まれていない**。period=all (since=epoch0) でも `feedback_items` が空なので 0 件。

### 1.4 照合結果
期待 ≠ 現実。だが **現実 = 現行 SPEC 通り** (Shipyard adapter は [論点-FI-4] として意図的に未実装)。期待自体は妥当 ([論点-007] の最終要件に shipyard 取り込みは含まれる) だが、**現時点では deferred follow-up が未実装**。period フィルタ/クエリの**バグではない** (データが無いだけ)。

## 2. 判定根拠

1. **バグではない**: period=all は `since=epoch0` で `listFeedback` が全件返す実装 (unit RU-04/U-07 で検証済)。空なのは `feedback_items` にデータが無いため = 取り込み未発生。クエリ/フィルタは正しく動作。
2. **仕様検討漏れではない (むしろ明示的に追跡済)**: Shipyard 取り込みは [論点-FI-4] + concept §6.2 #3 で「専用 adapter が必要・MVP スコープ外」と文書化済み。feature 設計時にユーザーが「標準のみ」を選んで deferred した。
3. **本質 = deferred follow-up ([論点-FI-4] Shipyard 専用 adapter) の未実装**。これを実装すれば期待が満たされる = feedback-inbox の改修 (revise)。
4. **ただし cross-repo 依存**: Shipyard adapter は「shipyard 側の contact 取得 API + HUB 側 adapter のセット」(concept §6.2 #3)。**shipyard 側に contact-fetch エンドポイントが無いと HUB adapter は pull 先が無く完成しない**。shipyard 側 API の契約 (パス/認証/レスポンス形) を決めるのは別 repo の product 判断。

## 3. 推奨分岐先
- **コマンド**: `/flow:revise feedback-inbox FI4-shipyard-adapter` ([論点-FI-4] を実装)
- **前提 (cross-repo)**: shipyard 側に contact 取得 API を設計・実装 (別 repo)。HUB adapter はその契約に合わせて pull。
- **優先度**: medium (運営者がテストで気づいた = 実運用前に塞ぎたいが、データ消失等の緊急性はない)

## 4. ユーザー判断が必要な点 (route 前に停止、root原則 #1)
Shipyard adapter は HUB 単独で完結せず **shipyard 側 contact API (別 repo) が前提**。どう進めるか = product sequencing の判断 (Class C)。下記 §6 で 1 問提示。

## 6. 関連
- クレーム原文: `./000_CLAIM_REPORT.md`
- 基準: concept §6.2 #3 / feedback-inbox SPEC §8 [論点-FI-4] / [論点-007]
- 分岐先候補: `../revise_FI4-shipyard-adapter_*/` (ユーザー判断後に作成)
