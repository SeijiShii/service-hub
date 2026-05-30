<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — service-hub (release-pre 2 段目、biz-charts)

**レビュー日**: 2026-05-31
**レビュー実施者**: Claude (Opus 4.8 1M) + seiji
**対象**: プロダクト全体 (biz-charts 完遂後の release-pre 再評価)
**入力**: concept.md (§3 NFR / §8) + biz-charts revise SPEC + api/dashboard/summary.ts diff
**観点ソース**: ~/.claude/flow-data/perspectives.md (O23-O28)
**dispatch 元**: /flow:auto §3.0c release-pre 必須監査 2 段目 (full audit に続く secure、CF-20260528-009)

## 1. PJ 性質判定
- 単一ユーザー個人ツール (seiji) / 個人・内部 (Clerk seiji 限定ゲート、エンドユーザー非公開) / 無償運用 / エンドユーザー PII 非取扱 (read-only プロバイダトークン + 自身のインフラ運用データのみ) / AI 利用なし (HUB 自身) / 国内。

## 2. 脆弱性パターン照合結果

### 2.1 サマリ
- Critical: 0 件
- High: 0 件
- Medium: 0 件
- Low: 0 件
- Info: 0 件
- 法令必須: 0 件 (internal/非公開で該当なし)
- **新規 SEC: 0 件**

### 2.2 biz-charts 変更の攻撃面評価
- **新 endpoint**: なし。biz-charts は既存 `/api/dashboard/summary` のまま。
- **新 external input**: なし。取得キー定数を `DASHBOARD_CHART_METRICS` → `DASHBOARD_CHART_SOURCE_METRICS` (mau/revenue_month_usd/ai_cost_month_usd) に変更しただけ。データ源は自 DB `recentSnapshots` で不変。採算(profit) は buildCharts がサーバ側で revenue−cost から派生 (外部入力なし)。
- **新 deps**: なし (`package-lock.json` 不変)。
- **認可面**: 不変 (Clerk 単一ユーザーゲート、O25 トークン集中対策維持)。
→ biz-charts は UI 表示メトリクスの組み替えのみで、新たな攻撃面を一切導入しない。

## 3. 既存 SEC findings (status)
| 論点 | SEC | 観点 | severity | status |
|---|---|---|---|---|
| [論点-004] | SEC-002 | O24 入力検証 (SSRF/安全パース/raw_json スクラブ) | Medium | **closed** (2026-05-27、実装充足) |
| [論点-005] | SEC-003 | O28 @vercel/node devDep High CVE 6 件 (dev/build/test tooling のみ、本番ランタイム依存ゼロ) | High (in-context Low) | **closed** (2026-05-28、accepted-risk ユーザー明示確定) |

- SEC-003: lockfile 不変 = 新規 CVE なし。accepted-risk 維持 (本番ランタイム依存に脆弱性ゼロ、dev tooling のみ)。

## 4. 次のステップ
release-pre secure クリア (新規 SEC 0)。release-pre 必須監査 2 段 (full audit D-010 + 本 secure) 完了 → **P4.7 Release gate (10th deploy) 評価可能**。
<!-- auto-generated-end -->
