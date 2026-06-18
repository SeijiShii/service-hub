# D20260618_001_resume_continuous — /flow:auto (hub → service-hub [論点-011])

**状態**: 完了
**モード**: continuous (hub `/flow:hub` → service-hub [論点-011] 自律)
**開始**: 2026-06-18

## サマリ

shipyard [論点-010] (summary 表示) の cross-PJ 上流 [論点-011] を service-hub 側で実装。
producer 自己申告 summary (O48 v3) → service-hub 取り込み → 公開 status API 露出 までを
favicon-projection (iconUrl) と対称に配線。本日の producer 作業 (hana-memo A1 等) と合わせ
summary パイプラインの欠落リンクを埋めた。

## decisions

- id: D20260618-001
  question: 反復1 auto-pick ([論点-011] summary-projection)
  chosen: /flow:revise _shared/types (public-status + db + adapter に summary 配線)
  chosen_type: auto-recommended
  context: |
    O48 v3 require 観点の consumer 追従。iconUrl=favicon-projection の確立パターンを完全に
    踏襲: types (ServiceInfoResponse/ServiceMeta/ServiceDescriptor) → adapter
    (pickServiceInfoSummary sanitize + meta 集約) → updateServiceMeta (列単位 SET 保持
    セマンティクス) → toServiceDescriptor → buildPublicStatus 安全投影 → db schema + testdb DDL。
    TDD: +16 tests (adapters SM-U-01〜07 / queries SM-U-10〜15 / public-status SM-PS-01〜03)。
    全 39 files / 353 tests green。
    prod 適用 (db:push で summary 列) は Class B (release 人手ゲート) として残す。
    pre-existing tsc finding (queries.test.ts:249) は stash 確認で本変更と無関係と確定。

## 成果物

- src/types/service.ts / adapters.ts / db/{schema,queries,testdb}.ts / features/public-status/buildPublicStatus.ts
- +16 tests across adapters / services / buildPublicStatus
- docs/_shared/types/revise_summary-projection_20260618/INDEX.md

## 残

- prod 適用: `db:push` で `services.summary` を本番反映 (= /flow:release、Class B)
- 下流: shipyard [論点-010] consumer (DB migration + StatusCard summary 表示 + 視覚レビュー)
