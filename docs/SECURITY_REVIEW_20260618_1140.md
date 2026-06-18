<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — service-hub (release-pre 2段目)

**レビュー日**: 2026-06-18
**レビュー実施者**: Claude (Opus 4.8 1M) + seiji
**対象**: summary-projection [論点-006] (commit 8e97a26) ＋ プロダクト全体差分
**入力**: src/providers/adapters.ts (pickServiceInfoSummary) / src/features/public-status/buildPublicStatus.ts / api/public/status.ts / src/types/service.ts
**観点ソース**: ~/.claude/flow-data/perspectives.md (O23-O28)
**契機**: §3.0c release-pre 必須監査 2段目 (1段目 = AUDIT_20260618_1139 Critical 0 / High 0)

## 1. PJ 性質判定
- 単一 owner (seiji)・内部・非公開ダッシュボード / 無償 / エンドユーザー PII なし / AI 利用なし / 国内。
- 公開 surface = `/api/public/status` (read-only 安全サブセット、別 PJ shipyard が consume)。

## 2. 脆弱性パターン照合結果 (summary-projection 差分)

### 2.1 サマリ
- Critical: 0 / High: 0 / Medium: 0 / Low: 0 / Info: 1
- 法令必須未対応: 0

### 2.2 詳細

#### [SEC-design] summary を公開 status API に露出する新 surface — 対応済 ✅
- **O24 入力検証**: `pickServiceInfoSummary` が (1) 型チェック (非 string reject) (2) 制御文字 (U+0000-001F, U+007F) を空白へ畳み (3) 連続空白圧縮 + trim (4) 長さ上限 `SUMMARY_MAX_LEN` reject (5) 空文字 reject。producer 自己申告の外部由来値を sanitize 済 → **対応済**。summary は URL でなくテキストのため SSRF 非該当 (iconUrl は別途 safeUrl)。
- **O25 秘密情報 / 内部データ漏洩**: `buildPublicStatus` は明示 DTO `{slug,name,status,iconUrl?,summary?}` のみ構築し内部 VM/財務指標を流用しない (コメント明記)。summary は producer 申告の公開向け showcase 文 = 設計上 public-safe。**漏洩リスクなし**。
- **O26 PII ログ**: reject 時の `console.warn` は `slug` + reason + len のみログ出力し **raw summary 本文をログに出さない** → PII/内容漏洩なし。**対応済**。
- **O23 認可**: `/api/public/status` は意図的に公開 read-only。summary 追加で認可境界に変化なし。
- **O27 レート制限 / O28 deps**: 既存公開エンドポイントの field 追加のみ、新エンドポイント・新依存なし → 変化なし。

#### [SEC-info-01] consumer (shipyard) 側の出力エスケープ責務 (Info、cross-PJ note)
- summary は producer 制御テキスト。service-hub は JSON で保存・再配信し XSS 面は無いが、**下流 shipyard が summary を HTML レンダリングする際は必ずエスケープする**こと (stored XSS の defense-in-depth)。service-hub 側の対応は不要 (sanitize で制御文字除去済)。shipyard PJ の実装時 note。

## 3. §8 未決事項に登録した論点
- なし (新規 Critical/High SEC finding 0 件)。

## 4. 次のステップ
- release-pre 必須監査 2段クリア (audit Critical 0/High 0 + secure 新規 SEC 0) → P4.7 Release gate 評価可能。
- summary prod 反映 (`db:push` services.summary 列 + redeploy) = Class B、ユーザー承認時に `/flow:release`。
<!-- auto-generated-end -->
