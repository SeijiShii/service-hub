<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — feedback-inbox

**レビュー日**: 2026-06-18
**レビュー実施者**: Claude (Opus 4.8) + seiji
**対象**: feedback-inbox ([論点-007]/O67、新 endpoint /api/feedback/inbox + feedback pull adapter)
**入力**: 001_SPEC + 002_PLAN + 実装コード (src/providers/feedback.ts / feedbackRunner.ts / api/feedback/inbox.ts / FeedbackInboxView.tsx) + concept §6.2
**観点ソース**: ~/.claude/flow-data/perspectives.md (O23-O28 + O54)
**severity-threshold**: medium

## 1. PJ 性質判定
個人ツール (UI あり・内部・非公開) / 単一ユーザー (seiji、Clerk gate) / 無償 / 個人情報扱いあり (feedback body = 他サービスのユーザー声、producer scrub 済) / AI 利用なし / 国内。

## 2. 脆弱性パターン照合結果

### 2.1 サマリ
- Critical: 0 / High: 0 / Medium: 0 / Low: 0 / Info: 2
- 法令必須未対応: 0

### 2.2 詳細

#### [O23 認可] PASS
- `/api/feedback/inbox` は `requireSeiji(getAuthFromRequest(headers))` で保護 (Clerk 単一ユーザー、既存 authed endpoint と同パターン)。認可ゲート結合テスト (cookie 無し/不正/x-clerk-user-id 偽装 = 全 401、DB 非到達) あり。

#### [O24 入力検証 / SSRF / 安全パース] PASS
- feedback pull は `safeFetch` (内部アドレス block / timeout 10s / redirect:manual) を利用 — SSRF/タイムアウト/リダイレクト追従抑止を既存と共有。
- 外部 producer の untrusted レスポンスを多段検証: `schemaVersion` 型 + `items` 配列チェック → reject、per-item で id 非空 / kind allowlist (未知 skip) / body 非空 / createdAt parse 可 を検証し不正 item を skip、body は `FEEDBACK_BODY_MAX=4000` で length cap。

#### [O25 秘密情報] PASS
- `HUB_SERVICE_INFO_SECRET` は `deps.env` 経由 (ハードコードなし)。ログに secret を出さない。新規 secret 追加なし (service-info と共用、`.env.example` 記載済)。

#### [O26 PII ログ] PASS (legal_required)
- feedback body は PII を含み得るが、**ログに body を出さない** (`console.warn` は slug/externalId/len のみ、badschema は slug のみ)。snapshots と異なり **rawJson を保存しない** (パース済みフィールドのみ)。

#### [XSS] PASS
- feedback body は React `<p>{item.body}</p>` で描画 (React 既定エスケープ)。`dangerouslySetInnerHTML` 不使用。claim テキストは clipboard コピーのみ。

#### [INFO-1] feedback body PII の保持期間
- MVP は全保持 + 表示直近 N ([論点-FI-2] で追跡済)。本人 (seiji) authed 限定アクセス + body length cap + rawJson 非保存で露出面は最小。長期累積時は剪定 cron ([論点-FI-2] 案 B) を検討。→ 設計済論点、追加対応不要。

#### [INFO-2] producer-side PII scrub の信頼前提
- 契約 (O66/concept §6.2) は「producer が送信前に PII scrub」を前提。HUB はそれを強制できない (信頼境界)。defense-in-depth として HUB 側で length cap + authed-only access + rawJson 非保存を実施済。producer scrub は各サービス側 (O40/O66) の責務。

#### [O22/O54 DSR-feasibility] N/A
- 単一ユーザー internal tool (seiji 自身のツール、公開ユーザー DSR 約束なし)。O22 (ゲスト認証) skip_if 該当。feedback データの本人 (= 各サービスのエンドユーザー) に対する DSR は producer サービス側の責務 (HUB は集約閲覧面)。本 PJ に DSR-feasibility ギャップなし。

## 3. §8 未決事項に登録した論点
- なし (新規 Critical/High SEC = 0)。

## 4. 次のステップ
- 本番反映 (db:push feedback_items + redeploy) 前に release-pre full audit + secure を §3.0c で実施。
- producer 各サービスが `/api/hub/feedback` 実装時 (O66)、各サービス側で送信前 PII scrub を担保すること。
<!-- auto-generated-end -->
