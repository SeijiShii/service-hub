# 設計レベル脆弱性レビュー — service-hub (release-pre 2 段目、fix C20260601-002)

**レビュー日**: 2026-06-01
**レビュー実施者**: Claude (Opus 4.8) + seiji
**対象**: プロダクト全体 (fix C20260601-002 後の差分中心)
**dispatch 元**: /flow:auto §3.0c release-pre 必須監査 2 段目 (full audit AUDIT_20260601_1229 に続く secure、CF-20260528-009)
**観点ソース**: ~/.claude/flow-data/perspectives.md (O23-O28)

## 1. PJ 性質
複数サービス横断モニタリング HUB / 公開 (custom domain) / Clerk production 認証 / 課金なし (監視ダッシュボード) / PII 最小 / 国内。

## 2. 脆弱性パターン照合結果

### 2.1 サマリ
- Critical: 0 / High: 0 / Medium: 0 / Low: 0 / Info: 0 — **新規 SEC = 0**
- 法令必須未対応: 0

### 2.2 差分評価 (fix C20260601-002)
- **L1 設計**: fix は runner.ts (収集オーケストレーション内部、capturedAt 共有) + MetricChart.tsx (描画) のみ変更。**新 API endpoint / 新外部入力 / 新認可境界なし** (`git diff 8b47810..HEAD` に api/ 変更なし)。O23 認可 / O24 入力検証 / O25 秘密 / O27 レート制限 への影響なし。
- **L4 依存**: `package-lock.json` 不変 (最終変更 29b2a2a、本 fix で deps 追加なし)。`npm audit` = moderate 11 / high 6、いずれも既知の **@vercel/node devDep transitive CVE** (dev/build/test tooling のみ、本番ランタイム依存ゼロ) = `[論点-005] SEC-003` で **closed (accepted-risk、2026-05-28 ユーザー明示確定)**。新規 CVE なし、accepted-risk 維持。

## 3. §8 未決事項
新規登録なし。既存 SEC findings は全 closed (001-005、SEC-003 accepted-risk 含む)。

## 4. 結論
release-pre secure クリア (**新規 SEC 0**)。release-pre 必須監査 2 段 (full audit AUDIT_20260601_1229 Critical0/High0 + 本 secure 新規0) 完了 → **P4.7 Release gate (11th deploy) 評価可能**。
