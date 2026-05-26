# dashboard 機能仕様書

> **役割**: 全サービス横断サマリ一覧画面（`/`）。各サービスの稼働/利用/コスト/障害を 1 画面で。
> **タグ**: feature, auth-required（Clerk gate）
> **最終更新**: 2026-05-26
> **入力**: `../concept.md`（§1.1 UC1 / §4）, `../_shared/{db,auth,types}/`, `../registry/`, `../design/design-system.md`（コックピット/dark）
> **依存**: `_shared/db`, `_shared/auth`, `registry`

---

## 1. 詳細 UC
### UC1（concept §1.1）: 全サービス横断サマリ
- **トリガー**: seiji が `/` を開く（Clerk 認証必須）。
- **入力**: なし。
- **処理**: `loadServices`（registry）+ `latestPerService`/`openAlerts`/`recentRuns`（db）を取得（**DB のみ読む、provider API は直叩きしない**）。
- **出力**: サービス行の一覧（StatusDot + slug + MAU + コスト概算 + エラー件数 + 最終更新）。ヘッダに全体サマリ（"N up · M down"）+ 最終収集時刻。down/警告のサービスを前景化。
- **代替/例外**: データ未収集 → EmptyState（"まだ収集なし、cron 待ち or 手動実行"）。収集失敗あり → AlertBanner。

## 2. 入出力
### 2.1 API（サーバー側データ取得）
| メソッド | パス | 出力 | 認証 |
|---|---|---|---|
| GET | `/api/dashboard/summary` | `{ services: [{descriptor, latestMetrics, openAlertCount}], lastRun }` | Clerk(requireSeiji) |
（または RSC / loader で直接 db クエリ。実装は PLAN）

### 2.2 画面要素（design-system 準拠）
- ServiceRow（StatusDot 形状+色 / slug=mono / MetricCell mono 右揃え / QuotaBar）。
- Header（プロダクト名 / "N up · M down" / 最終収集時刻 / seiji）。
- AlertBanner（down / 無料枠超過）。EmptyState。

## 3. データモデル
新規 entity なし。db の latestPerService/openAlerts/recentRuns + registry の ServiceDescriptor を結合表示。

## 4. バリデーション + エラーケース
| ケース | 表示 |
|---|---|
| 未認証 | Clerk サインインへ |
| データなし | EmptyState |
| 一部メトリクス欠損 | `—`（text-faint）で表示、行は出す |
| 直近 run=failed | AlertBanner で警告 |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| 表示速度 | DB 1-2 クエリで描画（provider 直叩きなし） | concept §3 性能 |
| 一覧性 | 数十サービスを 1 画面（compact 行） | design-system |
| a11y | 状態を色+形状で（色覚配慮）、コントラスト AA | design-system §8 |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| db | latestPerService/openAlerts/recentRuns |
| registry | サービスメタ |
| auth | requireSeiji |
| service-detail | 行クリックで `/services/:slug` へ |

## 6. タグ別追加項目
### auth-required
- Clerk gate（seiji のみ、_shared/auth）。

## 7. スコープ外
- 個別サービスの時系列詳細（service-detail）。pull 実行（collection）。

## 8. 未決事項
現時点で論点なし (2026-05-26)。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復8） | /flow:feature |
