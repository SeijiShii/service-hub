# 視覚デザインレビュー 2026-05-27 — business-observability UI

> `/flow:design --review-only` (Step 4)。ローカル headless スクショ (route-mock, Class A) を design-system.md に照合。
> 対象: business-observability (revise_001) で追加した 採算 / 決済離脱率 / 収益見込み / コストシミュレーション UI。

## スクショ
- `e2e/dashboard.spec.ts-snapshots/dashboard-happy-chromium-linux.png`
- `e2e/service-detail.spec.ts-snapshots/detail-happy-chromium-linux.png`
- `e2e/cost-sim.spec.ts-snapshots/cost-sim-happy-chromium-linux.png` (新規)

## 検出 → 修正
| 観点 | 検出 | 対応 |
|---|---|---|
| 原則1 status-first (採算) | 採算が無色のプレーン文字だった | `STATUS_COLOR`/`STATUS_SHAPE` で 黒字=up(緑)/薄利=warn(黄)/赤字=down(赤)/データなし=faint に色分け (TDD) |
| 原則1 status-first (離脱率) | 無色だった | >=50% down / >=30% warn / それ未満 up / 未申告 faint に色分け |
| 原則1 status-first (cost-sim 提案) | 無色だった | keep=up / upgrade・consolidate=warn / sunset=down + 形状記号 |
| 原則2 data-dense | mono 右揃え | 既存踏襲で OK |
| O38 コピー走査 | 採算/離脱率/格上げ/継続/撤退 等は技術用語でなくビジネス語 | jargon なし。トーン仕上げは `/flow:wording` 候補 |
| O41 入口理解 | 内部ツール (Clerk gate、リンク流入なし) | 非該当 |
| O43 価格透明性 | エンドユーザー課金画面なし (採算は運営者向け内部指標) | 非該当 |

## 結果: ✅ PASS
- dashboard: 採算 ($40 緑 / $0.50 黄 / $-7 赤) + 離脱率 (25% 緑 / 60% 赤 / — faint) が status 色で整列。
- service-detail: revenue 時系列 (accent 折れ線) + 収益見込み (1/2/3ヶ月 $60/$70/$80) + 決済ファネル section。
- cost-sim: アカウント別 無料枠% / 上限到達 / 格上げ額vs合算収益 / 提案 (色+形状)。

## 付随修正 (E2E 回帰)
- `.env.local` の `VITE_CLERK_PUBLISHABLE_KEY` がビルドに焼き込まれ GAP-3 サインインゲートが E2E でも出て全ルートがログイン画面で塞がる回帰を発見 → `playwright.config.ts` の webServer ビルドを `VITE_CLERK_PUBLISHABLE_KEY=` (bare) に固定。route-mock E2E は Clerk bare で動かす。

## 残 (minor, 非ブロック)
- cost-sim 無料枠消費% を高消費時に warn 色化 (現状プレーン、提案列で status は伝わる)。
