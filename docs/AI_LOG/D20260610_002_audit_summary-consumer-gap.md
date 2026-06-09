# D20260610_002 — service-info summary v3 consumer 追従ギャップ ([flow] 由来)

**状態**: 完了（audit-hittable 登録 + flow-suite 補強。実装は /flow:revise で別途）
**コマンド**: [flow] フィードバック対応（command-feedback-loop §2.5 + §0.5）
**日時**: 2026-06-10 (+09:00)
**model**: Claude Opus 4.8

## 背景（ユーザー [flow] 指示）
shipyard リブランドに伴い service-info 契約を変更: 各サービスの短文サマリ（summary）を ServiceHUB が受け取り shipyard（givers.work）へ配信する。ServiceHUB では表示不要。「flow コマンドに含め audit で検知する契約のはずが、service-hub 側 audit で未追従を検知していない」→ 確認し修正。

## triage: (c) 両方
- **(b) flow gap**: O48（service-info producer 契約）は `skip_if: service-hub 管理対象外` で HUB 自身を skip するため、契約 field 追加（summary v3 / CF-20260610-004）時に集約 consumer=service-hub の追従義務が **service-hub 側 audit で検出されない**。O48 note は consumer 追従を「tracked follow-up 起票」と散文で残すのみ = audit-hittable でない（O48 自身が CF-20260607-002 で warn していた anti-pattern の再発）。
- **(a) PJ gap**: `ServiceInfoResponse` が v2（iconUrl）止まりで `summary` 未実装。`buildPublicStatus.ts` の公開 status 安全サブセット DTO に summary 無し。

## 確認（audit が検知することの実証、§2.5 step 3）
O63 `required_signals=[summary, iconUrl]` を consumer 再公開パス（`src/types` / `api/public` / `src/features/public-status`）へ AND 検証:
- `summary`: **0 file ヒット = 未追従** → High consumer 追従 drift
- `iconUrl`: 4 file ヒット（v2 既追従）
`buildPublicStatus.ts` の `PublicServiceStatus` DTO = `{slug, name, status, iconUrl?}`（summary 無し）。
→ O63 + 本 concept [論点-006] 登録により、従来 clean pass していた本ギャップが audit #4 項目 3.7 で **High** として surface するようになった（= ユーザー要求「audit で検知」への直接の答え）。

## Decisions
- **D20260610-004** (command-feedback): CF-20260610-005 を flow-suite に即時適用（§0.5）。perspectives O63 新設 + O48 note 補強（commit 0d68173）/ audit.md #4 項目 3.7（commit 8c83364）/ inbox status applied（commit f44a50f）。chosen_type=auto（[flow] が authorization）。
- **D20260610-005** (audit-hittable 登録): concept §6.1 #6 + §8 [論点-006] に summary consumer 追従要件を detect signal 付きで登録（§2.5 PJ 固有チャネル）。chosen_type=auto。
- **D20260610-006** (実装は別途): 実装（types + 受信 + 公開 status API への summary 配線）は `/flow:revise` で Class A 実装（本セッションのスコープ外、§2.5 step 4）。chosen_type=open（次アクション）。

## 生成・更新ファイル
- flow-suite: `flow-data/perspectives.md`（O63 + O48 note + changelog）, `commands/audit.md`（#4 item 3.7 + changelog）, `flow-data/command-feedback-inbox.md`（CF-20260610-005）
- service-hub: `docs/concept.md`（§6.1 #6 + §8 [論点-006]）, 本 AI_LOG

## 次アクション
`/flow:revise _shared/types`（or public-status）で summary を `ServiceInfoResponse` + 受信パイプライン + `GET /api/public/status` 安全サブセットに配線（後方互換 optional）。実装後 audit で [論点-006] が close することを確認。下流 shipyard の一覧表示は別 repo。
