# service-detail 機能仕様書

> **役割**: 個別サービスの詳細・時系列画面（`/services/:slug`）。利用数/DB 使用量/帯域/エラーの推移グラフ。
> **タグ**: feature, auth-required
> **最終更新**: 2026-05-26
> **入力**: `../concept.md`（§1.1 UC2）, `../_shared/{db,auth,types}/`, `../registry/`, `../design/design-system.md`
> **依存**: `_shared/db`, `_shared/auth`, `registry`

---

## 1. 詳細 UC
### UC2（concept §1.1）: サービス個別の時系列
- **トリガー**: dashboard の行クリック → `/services/:slug`（Clerk 認証必須）。
- **入力**: `slug`（パス）、期間（既定 30 日、切替可）。
- **処理**: `loadServices` で descriptor 取得、`timeseries(slug, metricKey, since)`（db）を各メトリクスで取得。
- **出力**: サービスメタ（名前/URL/status/provider 構成）+ メトリクス別の時系列グラフ（Recharts）+ 直近アラート履歴 + 最終収集。
- **例外**: 不明 slug → 404。データなし → 各グラフに EmptyState。

## 2. 入出力
### 2.1 API
| メソッド | パス | 入力 | 出力 | 認証 |
|---|---|---|---|---|
| GET | `/api/services/:slug/timeseries` | slug, metricKey?, since? | `{ descriptor, series: {metricKey, points[]}[], alerts[] }` | Clerk |

### 2.2 画面要素（design-system）
- ヘッダ（名前/slug=mono/StatusPill/URL リンク）。
- Sparkline/折れ線（Recharts、accent + 状態色、mono 軸ラベル）。
- メトリクスカード（現在値 + 無料枠 QuotaBar）。アラート履歴テーブル。

## 3. データモデル
新規 entity なし。db timeseries/openAlerts + registry descriptor。

## 4. バリデーション + エラーケース
| ケース | 表示 |
|---|---|
| 未認証 | Clerk へ |
| 不明 slug | 404 ページ |
| メトリクスにデータなし | グラフ EmptyState、他は表示 |
| since 未来 | 空グラフ |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| グラフ描画 | DB timeseries クエリ（複合 index 活用） | db SPEC（service_slug,metric_key,captured_at） |
| 表示 | DB のみ（provider 直叩きなし） | concept §3 |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| db | timeseries/openAlerts |
| registry | descriptor |
| auth | requireSeiji |
| dashboard | 遷移元 |

## 6. タグ別追加項目
### auth-required
- Clerk gate。

## 7. スコープ外
- pull 実行（collection）。一覧（dashboard）。

## 8. 未決事項
現時点で論点なし (2026-05-26)。期間切替の粒度（時/日）は実装で調整。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復9） | /flow:feature |
