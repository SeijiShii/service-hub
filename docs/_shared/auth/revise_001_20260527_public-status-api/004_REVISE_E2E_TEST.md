# E2E テスト計画（public-status-api）

> **入力**: `./001_REVISE_SPEC.md`, concept §1.1, 既存 e2e
> **最終更新**: 2026-05-27
> **実行**: ローカル headless (route-mock / preview server、Class A)。`/flow:e2e` 担当。
> 注: 本 API は UI を持たない (公開ショーケースは別サービス)。E2E は**ハンドラの公開アクセス性 + 安全性**を実 HTTP で検証する軽い API レベル。

## 1. 変更 UC シナリオ
| シナリオ ID | 前提 | 操作 | 期待 |
|---|---|---|---|
| PS-E1 | preview server 起動 | 無認証で `GET /api/public/status` | 200 + JSON 配列（認証不要で叩ける唯一の API） |
| PS-E2 | 同上 | レスポンス検査 | 各要素が `{slug,name,url,status}` のみ。**`revenue`/`ai_cost`/`mau`/`raw_json` 等の内部キーが本文に存在しない** |
| PS-E3 | 同上 | OPTIONS `/api/public/status` | 204 + `Access-Control-Allow-Origin` |

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| 認可ゲート維持 | PS-RE1 | `GET /api/dashboard/summary` / `GET /api/cost-sim/summary` は**無認証で 401**のまま（公開ルート追加で他が緩まない） |
| デプロイ後スモーク | PS-RE2 | 本番 `curl https://<hub>/api/public/status` → 200 + 安全 JSON、`/api/dashboard/summary` → 401（実デプロイで公開/gate の境界を確認、O51） |

## 3. 移行検証シナリオ
なし（DB マイグレーションなし）。

## 4. 環境要件差分
- 既存 Playwright (bare build、route-mock) を踏襲。本 API は無認証なので Clerk gate の有無に関係なく叩ける（むしろ gate build でも通ることを確認できる）。
- DB を要するため preview server では DATABASE_URL が要る or route-mock。最小は API レスポンス形の検証。

## 5. 期待 KPI
| 指標 | 目標 |
|---|---|
| PS-E1〜E3 + リグレッション | 全 pass。特に PS-E2/PS-RE1（漏洩なし + gate 維持）は必須 |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成 | /flow:revise |
