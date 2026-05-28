<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — service-hub (release-pre 必須監査 2 段目)

**レビュー日**: 2026-05-28 17:28 (+09:00)
**レビュー実施者**: Claude (Opus 4.7 1M) + seiji (auto-dispatch via /flow:auto §3.0c release-pre hard-gate)
**対象**: service-hub 全体 (favicon-projection 直後の差分中心)
**入力**: docs/_shared/types/revise_favicon-projection_20260528/{001_REVISE_SPEC,002_REVISE_PLAN,905_REVISE_SPEC_REVIEW}.md + concept.md (§3 NFR / §6 外部連携 / §8 未決事項) + 過去 SECURITY 履歴
**観点ソース**: `~/.claude/flow-data/perspectives.md` O23-O28
**severity-threshold**: medium
**dispatch 元**: /flow:auto continuous loop reiteration 3 (audit クリア後の release-pre 2 段目)

## 1. PJ 性質判定

| 軸 | 判定 |
|---|---|
| ユーザー数 | 単一ユーザー (seiji) |
| 公開範囲 | 部分公開 (`/api/public/status` のみ、他は Clerk auth) |
| 有償 | 無償 (登録サービスを管理する自分用 dashboard、課金なし) |
| 個人情報 | 軽微 (Clerk セッション情報のみ、PII ログ厳禁) |
| AI 利用 | なし |
| 地域 | 国内 |

(既存 concept §1 / preferences で確定、本セッションで変更なし)

## 2. 脆弱性パターン照合結果

### 2.1 サマリ
- **新規検出**: **0 件** (本セッションで favicon-projection 関連の全 O23-O28 対応が spec-review R3/R6 + Phase 1-2 実装で完了済)
- 既存 §8 SEC pending: 1 件 (SEC-003 accepted-risk pending、Class C ユーザー判断待ち)
- Critical: 0 / High: 0 / Medium: 0 / Low: 0 / Info: 0
- 法令必須未対応: 0 件

### 2.2 詳細 (favicon-projection 関連 O23-O28 照合)

#### [SEC-FP-O23] O23 認可漏れ → ✅ 対応済
- **照合結果**: 対応済
- **該当箇所**: `001_REVISE_SPEC §3 影響範囲` + `§7.3 データモデル` + spec-review R2 三重防御
- **対応内容**:
  - iconUrl は **公開安全フィールド** として PublicServiceStatus に追加 (元々 web 公開 favicon URL、漏洩リスクなし、buildPublicStatus.ts §JSDoc 明示)
  - admin write 経路 (`upsertService` / admin API) では iconUrl 受け付けない = SoT 一貫性
  - 三重防御: (1) zod schema 不含 (stripUnknown) (2) `upsertService` SET 句不含 (3) テスト assert (FP-U-26/26b)
- **severity**: -

#### [SEC-FP-O24] O24 入力検証 → ✅ 対応済
- **照合結果**: 対応済
- **該当箇所**: `src/lib/safeUrl.ts` (`isSafePublicUrl`) + `src/providers/adapters.ts` (`pickServiceInfoIconUrl`)
- **対応内容**:
  - producer 申告 iconUrl の format check: URL parse + https only + internal アドレス拒否 (`localhost/127./10./192.168./169.254./172.16-31./0.0.0.0`) + 1024 chars 以内 + non-string 拒否
  - テスト網羅: FP-U-20〜25 (http/length/internal/javascript/non-string/empty) + FP-U-34 25 sub-cases (100% カバレッジ)
- **severity**: -

#### [SEC-FP-O25] O25 秘密情報 → ✅ 対応済
- **照合結果**: 対応済
- **該当箇所**: `src/providers/adapters.ts` `pickServiceInfoIconUrl` の stderr 警告ログ仕様
- **対応内容**:
  - silent reject + stderr 警告で **値そのものはログしない** (PII/secret 漏洩防止)
  - rejection 理由メタのみ: `slug` + `reason` (length/protocol/internal/parse/type/empty) + `rawType` (typeof)
  - テスト FP-U-33 で sensitive URL (`https://10.0.0.5/admin?token=SECRET_VALUE_123`) を入れて assert: warn 引数に sensitive 値が含まれないこと
- **severity**: -

#### [SEC-FP-O26] O26 PII ログ → ✅ 対応済
- **照合結果**: 対応済 (O25 と同パターン)
- **該当箇所**: 同上
- **対応内容**: 値ログ禁止、メタ情報のみ。FP-U-33 で test 担保
- **severity**: -

#### [SEC-FP-O27] O27 レート制限 → ✅ 対応済 (既存維持)
- **照合結果**: 対応済 (既存設計を維持)
- **該当箇所**: `api/public/status.ts` Cache-Control: public, max-age=60 (既存、変更なし) + favicon-projection は endpoint 動作変更なし
- **対応内容**: 公開 endpoint は既存 Cache-Control 60s で吸収、iconUrl 追加で rate-limit 観点に変更なし。論点-FP3 (Cache-Control 60s + cron 24h で iconUrl 反映 ≈ 24h+1m) は SPEC で「許容」と推奨済
- **severity**: -

#### [SEC-FP-O28] O28 依存脆弱性 → ✅ 既存維持
- **照合結果**: 対応済 (lockfile 変更なし)
- **該当箇所**: SECURITY_DEPS_20260527.md (前回 deps audit、accepted-risk pending = SEC-003)
- **対応内容**:
  - 本セッションで package.json / package-lock.json 変更なし → SECURITY_DEPS の再 scan は drift なし
  - 新規 dependency なし (safeUrl.ts / adapters.ts 拡張は std API + 既存 vitest/drizzle のみ使用)
- **severity**: -

#### [SEC-FP-SSRF] SSRF 予防 (O23/O24 横断) → ✅ 対応済
- **照合結果**: 対応済
- **該当箇所**: `src/lib/safeUrl.ts` (新規) + `src/registry/schema.ts` (publicUrl を safeUrl 経由に置換)
- **対応内容**:
  - SSRF 予防ロジックの **SoT 単一化** (spec-review R3、P19/P3 違反回避)
  - registry/schema.ts と adapters.ts (iconUrl format check) が共通の `isSafePublicUrl` を import
  - producer が誤って internal アドレス送ってきた場合の防御 (test FP-U-22 で 10.x.x.x 拒否確認)
- **severity**: -

## 3. §8 未決事項 (SEC pending findings)

### 3.1 本回新規登録
**なし** (本セッションで新規 SEC finding ゼロ)

### 3.2 既存 pending (Step 6.5 取り崩し)

| 論点 ID | severity | title | status | 推奨アクション |
|---|---|---|---|---|
| [論点-005] [SEC-003] | High (in-context Low) | @vercel/node devDep High CVE (ReDoS / undici) | open (accepted-risk 推奨、ユーザー明示確認待ち) | **Class C maintain** — 次回 `/flow:release` Phase 1 でユーザー確認窓 (auto-pick で accepted-risk 自動選択不可、Step 3.5.5 ルール準拠) |

**取り崩し結果**: SEC-003 は accepted-risk 受容には**ユーザー明示判断**が必要 (本コマンドの auto-pick 対象外、CF preserved)。前回 audit (1230b/1724) でも同様の指摘。**次回 release Phase 1 で 1 回確定すれば毎回再提示の悪循環を断てる**。

## 4. 次のステップ
- **release-pre 必須監査 (CF-009) クリア判定**: ✅ 新規 SEC finding 0 件 + 既存 1 件は Class C ユーザー判断 (release-blocking でない) → **P4.7 Release gate に進める**
- Critical/High 論点: なし → dispatch 不要
- L2 実装前チェックリスト生成: 不要 (favicon-projection は Phase 1-4 実装完了済、L2 後付け無意味)
- L4 依存スキャン: lockfile 変更なし → 前回 SECURITY_DEPS_20260527 を継承 (再 scan 価値低い)
- 次セッション以降:
  1. `/flow:release` で 5th deploy (admin-form + favicon-projection) + Phase 1 で SEC-003 accepted-risk ユーザー確認 + db:push 適用 + Class B 明示確認
  2. release 後: bousai-bag-checker 連動 revise dispatch リマインダ (CF-016)

<!-- auto-generated-end -->
