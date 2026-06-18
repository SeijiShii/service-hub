# revise_summary-projection_20260618 — 公開 status API に summary を含める [論点-011]

**状態**: shipped (17th deploy 本番反映済、services.summary 列 db:push 済、smoke green)
<!-- ticket-status: shipped | updated: 20260618 | ref: dpl_4bUadnQGfUGwoPHxpaajQjkxLnZT (17th deploy) -->

**種別**: revise (_shared/types + public-status + db — O48 v3 summary consumer 追従)
**起点**: shipyard concept §8 [論点-011] (cross-PJ 上流) / perspectives O48 v3 (CF-20260610-004)
**重要度**: — (shipyard [論点-010] ★★★必須 の上流 unblock)

## 概要

producer 各サービスが service-info に `summary` を自己申告 (O48 v3) → **service-hub が
`summary` を取り込み、公開 status API `GET /api/public/status` の安全サブセットに露出する** →
shipyard が消費して一覧に短文紹介を表示 ([論点-010])。本 revise は service-hub 側
(中間 + 露出) を担う。favicon-projection (iconUrl) と完全に対称な配線。

> 本日の producer 進捗: hana-memo が v3 summary producer 化 (A1)。naze-bako / time-budget も既。
> 残っていた欠落リンク = 本 revise (service-hub の summary 集約 + 公開露出)。

## 変更内容 (iconUrl=favicon-projection と対称)

| 層 | 変更 |
|---|---|
| `src/types/service.ts` | `ServiceInfoResponse.summary?` (v3) / `ServiceMeta.summary?` / `ServiceDescriptor.summary?` |
| `src/providers/adapters.ts` | `pickServiceInfoSummary` (型/空/長さ200/制御文字 sanitize) + createServiceInfoAdapter が iconUrl/summary を meta に集約 |
| `src/db/schema.ts` | `services.summary` text 列追加 |
| `src/db/queries.ts` | `updateServiceMeta` を**列単位 SET** へ (片側申告で他方を消さない保持セマンティクス) + `toServiceDescriptor` で summary round-trip |
| `src/features/public-status/buildPublicStatus.ts` | `PublicServiceStatus.summary?` + 安全投影 (有→含む/無→キー無し) |
| `src/db/testdb.ts` | test DDL に summary 列追加 |

## セキュリティ / SoT 一貫性 (iconUrl と同じ三重防御)

- summary 書き込みは **service-info adapter 経由のみ**。admin write (`upsertService`) は SET 句に
  summary を含めない (構造防御、SM-U-15 で assert)。
- summary は**公開安全フィールド** (一般向け紹介文、財務/コスト/内部指標でない)。公開 DTO は
  明示 allowlist 構築のため内部メトリクスは引き続き漏れない (SM-PS-03 / 既存 PS-S1 で担保)。

## 検証

- 全 **39 files / 353 tests green** (+16: adapters SM-U-01〜07 / queries SM-U-10〜15 / public-status SM-PS-01〜03)
- 既知の pre-existing tsc finding: `queries.test.ts:249` unused @ts-expect-error (本 revise と無関係・別テスト、stash 確認済)

## 残

- **prod 適用 = `db:push`** で `services.summary` 列を本番 Neon に反映 (= `/flow:release`、Class B 人手ゲート)。
- 反映後、shipyard [論点-010] consumer (StatusCard summary 表示 + 視覚レビュー) で表示まで一本化。
