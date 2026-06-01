# クレーム判定レポート

**claim id**: C20260601-001
**判定日**: 2026-06-01
**判定者**: Claude (opus-4-8) + seiji
**判定**: 却下 (Won't Fix) — service-hub 側。実障の修正先は bousai-bag-checker（別 repo）+ 運用（秘密一致）。

> **最終判定（2026-06-01、改訂2）**: ユーザー判断で **service-hub 側は Won't Fix**。
> 根拠: (1) スクショで「エラー 0 件 (ok) / 2 up」を確認 = HUB_SERVICE_INFO_SECRET を揃えたら
> 404 は解消（真因=秘密不一致の運用ミス、service-hub のコードは正しく動作）。(2) service-hub の
> adapter は 401/403→"auth" を既に正しくマップ済みで、振る舞いは妥当。(3)「本来 401」を返すのは
> producer（bousai-bag-checker）の責務で、その修正は別 repo の fix。
> よって当初の revise（_shared/providers 契約明文化）は**取り下げ**、`revise_C20260601-001_*` フォルダは削除。
>
> **下流（service-hub 外）**: ① 運用: 共有シークレット一致（対応済み）② bousai-bag-checker: 認証失敗で
> 401 を返す（404 をやめる）— 別 repo の fix。§3 参照。
>
> ---
> 以下 §1-2 は当初の三項照合（revise 寄り）分析。記録として残すが、最終判定は上記 Won't Fix。

## 1. 三項照合

### 1.1 期待 (Expected)
共有シークレット不一致で pull が弾かれたとき、症状は **401/403（認証失敗）**として現れ、
service-hub の adapter の既存マッピングで error が `"auth"` と表示される。運用者は
「秘密を直せ」と即判断できる。404（エンドポイント不在）とは明確に区別される。

### 1.2 既存仕様 (Spec)
- service-info 標準契約: `concept.md §6.1` + `[論点-003]`（line 372-383）。
  status=「スキーマ確定 (2026-05-26)」: `GET /api/hub/service-info` + 共有シークレット、
  body=`{schemaVersion, service, status, metrics?[], version?, extra?}`（+v2 iconUrl）。
- 契約 SoT: `_shared/providers`（service-info adapter SPEC §1.3）+ `_shared/types`
  （`ServiceInfoResponse`、`src/types/service.ts:29-44`）。
- **欠落**: 契約は「認証=共有シークレット」を規定するが、**認証失敗時に producer が返すべき
  HTTP status code（401/403）を規定していない**。成功 body の形のみ定義し、エラー時の
  status 意味論（401=auth / 404=不在 の区別）が未定義。

### 1.3 現実 (Actual)
- service-hub adapter は `Authorization: Bearer ${HUB_SERVICE_INFO_SECRET}` を送信
  （`src/providers/adapters.ts:207-212`）。
- status 分類: 401/403→`"auth"`, 429→`"rate_limited"`, それ以外→`http_<status>`
  （`adapters.ts:35-37`）。**service-hub 側のマッピングは妥当**（401 を返せば actionable）。
- しかし producer（bousai-bag-checker）が**秘密不正に対し 404 を返している**ため、
  service-hub は認証失敗を「不在」と誤認し汎用 `http_404` に落ちる
  （`runner.ts:44-49` で `{serviceSlug, provider, message:"http_404"}` に集約）。
- = service-hub 側コードは契約・実装ともに自仕様に反していない。**契約が producer の
  エラー status を縛っていない**ため、producer の 404 を許してしまっている。

### 1.4 照合結果
期待（認証失敗→401→`"auth"`）≠ SPEC（契約がエラー status を未規定）、
現実 = SPEC（service-hub 実装は契約準拠、producer の 404 を契約が禁じていない）。
→ service-hub のバグではなく、**service-info 契約のエラー status 意味論の検討漏れ（revise）**。
灰色ケース「期待が SPEC 外・現実 = SPEC」に該当。

## 2. 判定根拠

1. service-hub の adapter は 401/403→`"auth"` を既に正しくマップしており、実装は妥当。
   service-hub 自身がバグっているわけではない → fix（service-hub）ではない。
2. 真因は (a) 運用上の秘密不一致 と (b) producer が認証失敗で 404 を返すこと。(b) を防ぐには
   **契約が「認証失敗→401/403、404 は真の不在に限定」を明文化**する必要がある。これは契約
   （SPEC）の追補であり revise。
3. service-info 契約は既存（[論点-003] 確定済）であり、新規機能ではない。既存契約の精緻化
   → feature ではなく revise。
4. 期待は明確（401 で返す／返させる）で曖昧さがなく、論点登録して後日再判定する必要はない
   → 保留ではない。
5. 契約は **クロスサービス波及あり**（concept §6.1）。確定後、producer 各実装（bousai-bag-checker
   含む）が 401 を返すよう retrofit が必要 = 下流に bousai-bag-checker 側の fix が発生（別 repo）。

## 3. 推奨分岐先

- **コマンド**: `/flow:revise`
- **主たる対象**: `_shared/providers`（service-info 契約 = adapter SPEC §1.3 の SoT）
- **引数**: `_shared/providers C20260601-001 --from-claim=C20260601-001`
- **scope（revise 側で確定する検討材料）**:
  1. **契約のエラー status 意味論を明文化**（主）: 認証失敗（秘密不一致/欠落）→ **401（または 403）**、
     404 は「エンドポイント自体が存在しない」場合に限定。`_shared/providers` の service-info
     contract SPEC + `_shared/types` のドキュメントに追記（必要なら schemaVersion / 契約版を bump）。
  2. **producer 実装への波及（クロスサービス）**: concept §6.1 の波及経路に従い、producer 実装
     ガイド（bousai-bag-checker / hana-memo 等）が認証失敗で 401 を返すよう retrofit を要求。
     bousai-bag-checker 側の実コード修正は**別 repo の /flow:fix**（本 revise の下流タスクとして記録）。
  3. **（副次・任意）service-hub の診断強化**: 契約違反（producer が 404 等を返す）に備え、
     adapter/collection の error に **失敗 endpoint URL** を含める or `http_404` に
     「認証失敗で 404 を返す producer の可能性 → HUB_SERVICE_INFO_SECRET と producer 実装を確認」
     の対処ヒントを付す。型変更（`CollectionRun["errors"][n]` に url/category）は `_shared/types` 連動。
- **優先度**: medium

## 4. 却下時の対応
（該当なし）

## 5. 判定保留時の論点
（該当なし）

## 6. 関連

- クレーム原文: `./000_CLAIM_REPORT.md`
- 契約 SoT: `concept.md §6.1` / `[論点-003]`（line 372-383） / `src/types/service.ts:29-44`
- 発生源: `src/providers/adapters.ts:35-37, 207-212`, `src/features/collection/runner.ts:44-49`
- 真因（運用即時アクション）: HUB_SERVICE_INFO_SECRET の service-hub ↔ bousai-bag-checker 間一致確認
- 下流タスク（別 repo）: bousai-bag-checker の service-info エンドポイントが認証失敗で 401 を返すよう fix
- 分岐先サブフォルダ: `../../_shared/providers/revise_C20260601-001_20260601_service-info-error-status/`
