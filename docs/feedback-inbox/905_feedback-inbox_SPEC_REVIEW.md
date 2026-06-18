<!-- auto-generated-start -->
# 設計レビューレポート — feedback-inbox

**レビュー日**: 2026-06-18
**レビュー実施者**: Claude (Opus 4.8) + seiji
**対象**: feedback-inbox ([論点-007] / O67 consumer)
**入力**: docs/feedback-inbox/001-004 + concept.md §1.3.1 / §6.2
**観点ソース**: 組み込みチェックリスト + ~/.claude/flow-data/review-perspectives.md (P26/P37/P46/P51)
**モード**: auto-pick
**severity-threshold**: low

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|------|------|------|
| 仕様の明確性 | OK | UC/契約型/エラーケースが明示 |
| 既存パターンとの一貫性 | 要確認 | pull adapter は service-info を mirror できるが、runner 統合方法に責務分離が必要 (R1) |
| API 設計 | 要確認 | feedback endpoint の解決方法が未定義 (R2) |
| エラーハンドリング | 要確認 | feedback pull エラーの記録先が ProviderKind union と衝突 (R3) |
| テストカバレッジ | OK | 003/004 が正常/異常/境界/認証を網羅 |
| 影響範囲・副作用 | 要確認 | runner.ts (fragile, fix コメント多数) への変更を最小化すべき (R1) |
| API 流用・責務逸脱 | 要確認 | feedback (item list) を UsageMetric 責務に混ぜない (R1) |
| 既存実装の再利用 | OK | safeFetch / ServiceIcon / StatusDot / onConflict 冪等 を再利用 (R4-R6) |
| データ移行・互換性 | OK | feedback_items 新規テーブル、既存非破壊。prod 反映は db:push=Class B |
| 権限・認可 | OK | requireSeiji 再利用、pull は HUB_SERVICE_INFO_SECRET 共用 |
| UX・操作性 | OK | フィルタ/空状態/トリアージ導線を明示 |
| 学習済み観点 (P 系) | OK | P37/P46/P51/P26 適用済 |

## 2. 指摘事項 (severity 降順)

### [R1] feedback pull を runner の metrics ループに混ぜない (責務分離) (severity=High)
- **対象**: 002_PLAN Phase 3 / §1 ファイル一覧 / §4 既存ファイル影響
- **現状**: PLAN が「collection runner の per-service パスに feedback pull adapter を統合」と記載
- **問題**: `src/features/collection/runner.ts` の `runCollection` は `ProviderAdapter.collect()` → `{metrics: UsageMetric[], meta?}` を per-service×per-adapter ループで処理し、**単一 capturedAt 共有 / 非有限値 skip / batch insert 保護** という invariant を持つ (C20260601-002 / C20260607-002 の fix コメントが示す fragile かつ重要なコード)。feedback は **item のリスト**で `UsageMetric` ではないため、このループに混ぜると (a) `ProviderAdapter` インターフェースの責務逸脱、(b) metrics batch invariant の破壊リスク。
- **推奨**: feedback pull は **別オーケストレーション関数 `runFeedbackCollection(deps)`** として実装し、`api/cron/collect.ts` で `runCollection` と並行 invoke する。runner.ts 本体は変更しない (影響範囲を feedback adapter + 新関数 + cron 配線に限定)。
- **種別**: 指摘事項 (自動反映)
- **chosen**: 別関数 `runFeedbackCollection` に分離
- **chosen 根拠**: 既存 `updateServiceMeta` hook の前例はあるが、feedback は list 取得 + 別テーブル upsert で粒度が違う。runner を threading するより別関数の方が影響範囲が小さく既存テスト回帰リスクが低い (P37 副作用 atomic / P46 実変更対象明記)。
- **反映先**: 002_PLAN §1 (runner.ts 行を削除、新規 `src/features/collection/feedbackRunner.ts` 追加) / Phase 3 / §4 / §6

### [R2] feedback endpoint の解決方法を明示せよ (severity=Medium)
- **対象**: 001_SPEC §2.1 / §UC2
- **現状**: 「GET {base}/api/hub/feedback」と記載するが base の出所が曖昧
- **問題**: service-info adapter は `s.serviceInfo.endpoint` (明示設定 URL) を使う。feedback は `/api/hub/feedback` という **別パス**で、registry に専用 field は無い。解決法が未定義だと実装で誤る。
- **推奨**: `s.serviceInfo.endpoint` が設定済ならその **origin** + 固定パス `/api/hub/feedback`、未設定なら `s.url` の origin + 同パスで派生する。**新規 registry field は追加しない** (concept §6.1「各サービスが 5 分で足せる軽い契約」維持、O66 が固定パスを規定)。
- **種別**: 指摘事項 (自動反映)
- **chosen**: origin 派生方式 (registry field 追加なし)
- **反映先**: 001_SPEC §2.1

### [R3] feedback pull エラーの記録先 (severity=Medium)
- **対象**: 001_SPEC §4.2 / 002_PLAN
- **現状**: SPEC §2.3/§4.2 が「collection_runs.errorsJson に記録」と記載
- **問題**: `collection_runs` の errors は `provider: ProviderKind` 型。feedback は ProviderAdapter でない (R1) ため "feedback" を ProviderKind に足すのは責務汚染。
- **推奨**: feedback pull は別 orchestration ゆえ、エラーは **独自に記録** (MVP は `console.warn` + `runFeedbackCollection` の戻り値サマリ。将来必要なら `feedback_runs` テーブル)。`collection_runs`/`ProviderKind` は変更しない。
- **種別**: 指摘事項 (自動反映)
- **chosen**: 独自記録 (MVP=warn+戻り値サマリ)
- **反映先**: 001_SPEC §4.2

### [R4] fetch ヘルパの再利用 (severity=Low)
- **対象**: 002_PLAN §1 / §6
- **現状**: feedback adapter が JSON 取得を行う
- **問題**: adapters.ts の `getJson` は private (export されていない)。複製すると重複。
- **推奨**: feedback adapter は `safeFetch` を直接利用する (getJson は薄いラッパで、export して共有するほどでもない)。SSRF/timeout/redirect 抑止は safeFetch が担保。
- **chosen**: safeFetch 直接利用
- **反映先**: 002_PLAN §6 注記

### [R5] UI コンポーネント再利用 (severity=Low)
- **対象**: 002_PLAN §1 (UI ファイル)
- **推奨**: inbox 行のサービス識別は既存 `src/components/ServiceIcon.tsx` を、状態表示は `StatusDot.tsx` を再利用する (P26 共有コンポーネント)。
- **chosen**: ServiceIcon / StatusDot 再利用
- **反映先**: 002_PLAN §1

### [R6] upsert 冪等パターン (severity=Info)
- **推奨**: `upsertFeedbackItems` は usageSnapshots の `uniqSnap` onConflict 冪等パターンを踏襲し、unique index `(serviceSlug, externalId)` で重複を吸収する。確認のみ (設計は既に整合)。

### [R7] P51: 「表示のみ」画面の更新 endpoint 確認 (severity=Info)
- **確認結果**: inbox は pull only でフィードバックへの writeback endpoint を持たない (設計通り)。トリアージは `/flow:claim` 起票導線のみで HUB→producer の状態書き戻しは無い。P51 (表示のみ画面でも更新 endpoint の有無を確認) クリア。

## 3. コードベース調査結果

### 3.1 既存パターン
- pull adapter: `src/providers/adapters.ts` — `wrap`/`wrapWithMeta` で `ProviderAdapter` を生成、`getJson` + `safeFetch` で取得、`HUB_SERVICE_INFO_SECRET` を Bearer に。`createServiceInfoAdapter` が `s.serviceInfo.endpoint` を叩き `{metrics, meta}` を返す。
- orchestration: `src/features/collection/runner.ts` `runCollection` — per-service×per-adapter ループ、単一 `capturedAt`、非有限 skip、batch saveSnapshots、`updateServiceMeta` hook で非 metric メタを services テーブルへ。
- 永続化: `src/db/schema.ts` (drizzle pgTable + uniqueIndex 冪等) / `queries.ts` (pglite test)。
- API: `api/*/*.ts` Vercel handler — `requireSeiji(getAuthFromRequest(headers))` で認証 → `createDb` → query → json。
- UI: React 19 + react-router、`src/features/<f>/<F>Page.tsx`(取得) + `<F>View.tsx`(presentational)、共有 `components/{ServiceIcon,StatusDot,MetricChart}`。

### 3.2 影響範囲分析
| 変更対象 | 既存呼び出し箇所 | 呼び出し元の前提 (契約) | 破壊リスク |
|---|---|---|---|
| `runCollection` (runner.ts) | `api/cron/collect.ts` / `api/admin/collect.ts` / runner.test.ts | `{metrics, meta}` adapter 契約 + 単一 capturedAt + batch invariant | **R1 で変更しない** → なし |
| `ProviderKind` union | adapters / runner / errors | 既存 provider 種別 | **R3 で feedback を足さない** → なし |
| `src/db/schema.ts` `schema` export | db/index, drizzle push | 既存テーブル | feedbackItems 追加のみ (非破壊)。prod 反映=db:push (Class B) |
| `services` テーブル | registry/queries | 既存列 | 変更なし (feedback は別テーブル) |
| `src/main.tsx` ルート | SPA ルーティング | 既存ルート | `/feedback` 追加のみ |

### 3.3 API 責務の評価
- feedback pull は **metrics 収集 (ProviderAdapter) とは別責務** (item list 取得 + PII 含み得る本文 + 別保持方針)。R1 で別 orchestration に分離することで責務を明確化。`/api/hub/feedback` (producer) と `/api/feedback/inbox` (consumer 表示) はパス語が衝突しないか確認 → `hub` (サービス→HUB 提供) と `feedback/inbox` (HUB 内部表示) で明確に分離、流用なし。

## 4. 設計判断ログ

| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| D1 | feedback pull の orchestration 配置 | runner と分離した `runFeedbackCollection` | auto-recommended | 002 §1/§3/§4/§6 |
| D2 | feedback endpoint 解決 | origin 派生 (registry field なし) | auto-recommended | 001 §2.1 |
| D3 | feedback pull エラー記録 | 独自記録 (collection_runs/ProviderKind 不変) | auto-recommended | 001 §4.2 |
| D4 | fetch ヘルパ | safeFetch 直接 | auto-recommended | 002 §6 |
| D5 | UI 再利用 | ServiceIcon/StatusDot | auto-recommended | 002 §1 |

## 5. 次のステップ
- 反映済み 001/002 を確認
- `/flow:tdd feedback-inbox` で実装着手 (Phase 1 型+DB → Phase 2 adapter → Phase 3 feedbackRunner+cron → Phase 4 API+VM → Phase 5 UI)
<!-- auto-generated-end -->
