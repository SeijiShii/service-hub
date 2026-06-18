# feedback-inbox E2E テスト計画

> **入力**: `./001_feedback-inbox_SPEC.md`, `../concept.md` §1.1
> **最終更新**: 2026-06-18
> **実行**: `/flow:e2e feedback-inbox` (本計画を実行し `103_*_E2E_REPORT.md` 生成)

---

## 1. ユーザージャーニー

### UC 1: 運営者がフィードバックを横断閲覧する

| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| UC1-S1 (happy) | Clerk ログイン済 + feedback_items に複数サービスの seed | `/feedback` を開く | 一覧が createdAt 降順で表示、各行にサービス名・kind バッジ・本文 |
| UC1-S2 (service filter) | 同上 | サービスフィルタで 1 サービス選択 | その slug のみ表示 |
| UC1-S3 (kind filter) | 同上 | kind=bug 選択 | bug のみ表示 |
| UC1-S4 (empty) | feedback_items 0 件 | `/feedback` を開く | 空状態メッセージ ("まだフィードバックはありません" 等、O38/O41 準拠コピー) |
| UC1-S5 (auth) | 未ログイン | `/feedback` を開く | Clerk サインインへリダイレクト / 401 |

### UC 3: トリアージ導線

| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| UC3-S1 | UC1-S1 表示済 | 1 item の「トリアージ」操作 | claim 用テンプレ (サービス/kind/本文) が表示 or クリップボードコピー |

> UC2 (定期 pull) は cron バックグラウンド処理のため E2E ではなく単体テスト (U-08/U-11/U-20〜) でカバー。

## 2. 環境要件
| 項目 | 要件 |
|---|---|
| ブラウザ | Chromium (主)、必要に応じ WebKit |
| 画面サイズ | デスクトップ + モバイル (運営者は PC 主) |
| オフライン | ❌ |
| GPS / カメラ / 通知 | ❌ |
| 認証 | Clerk テストユーザー (seiji)、dev は stub/dev key、ローカル headless で実行 (Class A) |

## 3. データセットアップ
### 3.1 Seed
- `feedback_items` に 2-3 サービス分の feedback/bug/inquiry を各数件 (createdAt をばらす)
- `services` に対応する slug + name
### 3.2 Cleanup
- テスト DB (pglite or 専用 schema) を teardown でリセット

## 4. タグ別追加シナリオ
- auth-required: UC1-S5 (未認証リダイレクト) が該当。他タグ (offline/realtime/i18n) は非該当

## 5. レイアウト・ビジュアル検証 (perspectives O34)

### 5.1 Level 1: Pixel Visual Regression (Playwright、CI 標準) — ✅ 採用
| シナリオ ID | スクリーンショット名 | mask 対象 |
|---|---|---|
| UC1-S1 | `feedback-inbox-list.png` | 受信日時 (time) / 動的 id |
| UC1-S4 | `feedback-inbox-empty.png` | — |

### 5.2 Level 2: 意味的アサーション — ✅ 採用 (新規 layout)
| # | 要件 | アサーション |
|---|---|---|
| L2-1 | 一覧は新しい順 (各行 createdAt が単調減少) | 行の time 属性が降順 |
| L2-2 | kind バッジが視認できる色分け | bug/inquiry/feedback で異なる背景色 |
| L2-3 | フィルタ UI は一覧より上 | フィルタ box.y < 一覧 box.y |
| L2-4 | 空状態メッセージが中央表示 | 空状態要素が viewport 内に存在 |

### 5.3 Level 3: AI Vision — ❌ 不採用
- 重要 LP/決済画面ではない内部運営ツールのためコスト (Class B-4) を掛けない

### 5.4 採用 Level 根拠
- Level 1/2 採用 = 新規一覧 layout の regression 防止 + 意味的妥当性確認。Level 3 は内部ツールで不要。

## 6. 期待 KPI
| 指標 | 目標 |
|---|---|
| シナリオ成功率 | 100% |
| Level 1 snapshot 差分 | 0 |
| Level 2 assertion pass 率 | 100% |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-18 | 初版作成 | /flow:feature |
