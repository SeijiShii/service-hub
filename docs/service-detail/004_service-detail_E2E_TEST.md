# service-detail E2E テスト計画

> **入力**: `./001_service-detail_SPEC.md`, `../concept.md` §1.1, `../design/design-system.md`
> **最終更新**: 2026-05-26
> **実行**: `/flow:e2e service-detail`（ローカル headless = Class A）。FW: Playwright

---

## 1. ユーザージャーニー（UC2）
| シナリオ ID | 前提 | 操作 | 期待結果 |
|---|---|---|---|
| UC2-S1 (happy) | seiji 認証済 + seed timeseries | `/services/hana-memo` を開く | メタ + 各メトリクスの折れ線グラフ表示 |
| UC2-S2 (nav) | dashboard 表示 | 行クリック | `/services/:slug` 遷移、詳細表示 |
| UC2-S3 (404) | 不明 slug | `/services/unknown` | 404 ページ |
| UC2-S4 (no-data) | snapshot なし service | 開く | グラフ EmptyState、メタは表示 |
| UC2-S5 (auth) | 未認証 | 開く | Clerk へ |

## 2. 環境要件
| 項目 | 要件 |
|---|---|
| ブラウザ | Chromium |
| 認証 | Clerk テスト or mock |
| DB | seed timeseries 投入 |
| 外部 provider | 不要（DB のみ） |

## 3. データセットアップ
- Seed: 1 service + 複数メトリクスの timeseries（30 日分）+ アラート履歴数件。
- Cleanup: テスト DB truncate。

## 4. タグ別追加シナリオ
auth-required: UC2-S5。

## 5. レイアウト・ビジュアル検証（O34）
### 5.1 Level 1
| シナリオ | スクショ | mask |
|---|---|---|
| UC2-S1 | `detail-happy.png` | 動的時刻軸ラベル |

### 5.2 Level 2
| # | 要件 | アサーション |
|---|---|---|
| L2-1 | チャートは accent/状態色 | 折れ線 stroke がトークン色 |
| L2-2 | 軸ラベル mono | axis tick の font-family mono |
| L2-3 | dark 背景・コントラスト | surface トークン背景 |

### 5.3 Level 3
- 不採用（内部ツール）。

### 5.4 採用 Level
- Level 1: ✅ / Level 2: ✅ / Level 3: ❌

## 6. 期待 KPI
| 指標 | 目標 |
|---|---|
| シナリオ成功率 | 100% |
| Level 1 差分 | 0 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
