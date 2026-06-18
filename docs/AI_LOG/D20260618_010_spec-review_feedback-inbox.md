# D20260618_010_spec-review_feedback-inbox — /flow:spec-review feedback-inbox

**実行日時**: 2026-06-18
**コマンド**: /flow:spec-review
**対象**: feedback-inbox (001-004)
**実行者**: seiji (auto via /flow:auto D20260618_008)
**モード**: auto-pick
**状態**: 完了

## サマリ

[論点-007]/O67 consumer 設計 (D20260618_009) の実装前レビュー。実コード調査 (adapters.ts /
runner.ts / queries.ts / schema.ts / api handler) に基づき責務分離・既存パターン整合・再利用機会を
検証。最重要 = **feedback pull を runner.ts の ProviderAdapter/UsageMetric ループに混ぜない (責務逸脱)**。

| # | severity | 指摘 | chosen | 反映先 |
|---|---|---|---|---|
| R1 | High | feedback pull を runner の metrics ループに混ぜず別 orchestration 関数 `runFeedbackCollection` に分離 (metrics batch invariant 保護) | 分離 | 002 PLAN Phase3/§1/§4 |
| R2 | Medium | feedback endpoint 解決法 = service-info endpoint origin (or s.url) + 固定 `/api/hub/feedback` 派生、新規 registry field 不要 | 派生方式 | 001 SPEC §2.1 |
| R3 | Medium | feedback pull エラーは collection_runs.errorsJson の ProviderKind union に依存させず独自記録 (MVP=warn+簡易) | 独自記録 | 001 SPEC §4.2 |
| R4 | Low | adapters.ts `getJson` は private → feedback.ts は safeFetch 直接利用 (重複ヘルパ作らない) | safeFetch 直接 | 002 PLAN §6 |
| R5 | Low | inbox 行は既存 `ServiceIcon`/`StatusDot` を再利用 | 再利用 | 002 PLAN §1 |
| R6 | Info | upsert は usageSnapshots の onConflict 冪等パターン踏襲 (uniqueIndex) | 踏襲 | 確認のみ |
| R7 | Info | P51: 「表示のみ」inbox に writeback endpoint が無いことを確認 (pull only 設計通り) | 確認OK | — |

**適用 P 原則**: P37 (副作用 atomic) / P46 (共通ヘルパ変更は実対象明記) / P26 (共有コンポーネント複数パス) / P51 (表示のみ画面の更新 endpoint 確認)。
**生成**: 905_feedback-inbox_SPEC_REVIEW.md。**反映**: 001_SPEC (§2.1/§4.2) + 002_PLAN (§1/§3/§6)。
**次**: /flow:tdd feedback-inbox。

## Decisions

- id: D20260618-010-00
  command: /flow:spec-review
  phase: Step 1 (コードベース調査)
  question: feedback pull の既存統合先・影響範囲・責務評価
  chosen: 別 orchestration 関数に分離 (R1) + endpoint 派生 (R2) + 独自エラー記録 (R3)
  chosen_type: auto-recommended
  context: |
    runner.ts (runCollection) は ProviderAdapter.collect() → {metrics: UsageMetric[], meta?} を
    per-service×per-adapter ループで処理し、metrics を単一 capturedAt + 非有限 skip + batch insert で
    永続化する (C20260601-002/C20260607-002 の fix コメント多数 = fragile/重要)。feedback は item の
    リストで UsageMetric ではない → このループに混ぜると責務逸脱 + batch invariant を壊すリスク (R1 High)。
    既存 updateServiceMeta hook (非 metric の side-channel を hook で永続化) の前例はあるが、feedback は
    list 取得 + 別テーブル upsert で粒度が違うため、runner を threading するより別関数
    runFeedbackCollection(deps) を api/cron/collect.ts で runCollection と並行 invoke する方が影響範囲が
    小さく安全 (P37/P46)。endpoint は service-info の ref.endpoint と別パス (/api/hub/feedback) のため
    origin 派生で解決し registry field を増やさない (concept §6.1「5分で足せる軽い契約」維持、R2)。
    エラーは別 orchestration ゆえ collection_runs の ProviderKind union を汚さず独自記録 (R3)。
    再利用: safeFetch 直接 (getJson は private、R4) / ServiceIcon・StatusDot (R5) / onConflict 冪等 (R6)。
    P51: inbox に writeback endpoint 無し = pull only 設計通り (R7 OK)。
