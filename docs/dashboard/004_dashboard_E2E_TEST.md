# dashboard E2E テスト計画

> **入力**: `./001_dashboard_SPEC.md`, `../concept.md` §1.1, `../design/design-system.md`
> **最終更新**: 2026-05-26
> **実行**: `/flow:e2e dashboard`（ローカル headless = Class A）。FW: Playwright（concept §4.3 / O33）

---

## 1. ユーザージャーニー（UC1）
| シナリオ ID | 前提 | 操作 | 期待結果 |
|---|---|---|---|
| UC1-S1 (happy) | seiji 認証済 + seed 3 service(2up/1down) | `/` を開く | 3 行表示、ヘッダ "2 up · 1 down"、down 行が down 色 |
| UC1-S2 (empty) | service なし | `/` を開く | EmptyState 表示 |
| UC1-S3 (auth) | 未認証 | `/` を開く | Clerk サインインへリダイレクト |
| UC1-S4 (nav) | seed あり | 行をクリック | `/services/:slug` へ遷移 |
| UC1-S5 (failed run) | 直近 run=failed seed | `/` を開く | AlertBanner 表示 |

## 2. 環境要件
| 項目 | 要件 |
|---|---|
| ブラウザ | Chromium（主）、必要なら WebKit |
| 画面サイズ | デスクトップ（主）、モバイル確認 |
| 認証 | Clerk テストモード or auth mock（dev） |
| DB | seed 投入したローカル/テスト DB |
| 外部 provider | 不要（dashboard は DB のみ読む。pull は collection の領域、ここでは seed 済 DB） |

## 3. データセットアップ
- Seed: services.toml fixture(3) + usage_snapshots(各 up/down) + 1 件 failed collection_run + 1 件 openAlert。
- Cleanup: テスト DB truncate。

## 4. タグ別追加シナリオ
auth-required: 未認証リダイレクト（UC1-S3）で担保。

## 5. レイアウト・ビジュアル検証（O34）
### 5.1 Level 1 (Pixel regression, Playwright snapshot)
| シナリオ | スクショ | mask |
|---|---|---|
| UC1-S1 | `dashboard-happy.png` | 最終収集時刻（動的） |
| UC1-S2 | `dashboard-empty.png` | — |

### 5.2 Level 2 (意味的アサーション)
| # | 要件 | アサーション |
|---|---|---|
| L2-1 | down 行が視覚的に前景化 | down 行の StatusDot 色 = `--status-down`（getComputedStyle） |
| L2-2 | メトリクスは右揃え mono | MetricCell の `font-family` mono + `text-align: right` |
| L2-3 | 状態は色のみでなく形状でも区別 | down/up で異なるアイコン要素が存在 |
| L2-4 | dark 背景 | body/surface 背景が dark トークン |

### 5.3 Level 3 (AI Vision)
- **不採用**（内部ツール、重要 UX 画面でない。コスト B-4 回避）。

### 5.4 採用 Level
- Level 1: ✅ / Level 2: ✅（design-system 準拠確認）/ Level 3: ❌

## 6. 期待 KPI
| 指標 | 目標 |
|---|---|
| シナリオ成功率 | 100% |
| Level 1 差分 | 0 |
| Level 2 pass | 100% |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
