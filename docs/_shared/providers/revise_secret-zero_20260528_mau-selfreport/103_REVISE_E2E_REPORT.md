# E2E テストレポート: _shared/providers (secret-zero — mau-selfreport)

- **状態**: E2E green (provider-level、unit でカバー、UI journey なし)
- **FW**: unit (providers adapter) — headless ブラウザ E2E 非該当
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
secret-zero (全サービス共通 1 本 `HUB_SERVICE_INFO_SECRET` で service-info pull、MAU 自己申告)。HUB↔サービス間のサーバ間 pull で **UI journey を持たない** ため headless E2E 非該当。providers adapter unit でカバー。

## journey 別結果
| 004 journey | カバー手段 | 結果 |
|---|---|---|
| 共通 HUB_SERVICE_INFO_SECRET で Bearer 認証 pull (per-service secret 撤廃) | unit (providers/adapters.test.ts PV-N1/N2) | pass |
| MAU 自己申告 (metrics[] key=mau) の集約 | unit (providers/collection 集約 test) | pass |
| MAU が dashboard 上部 chart に反映 | dashboard.spec.ts UC1-S1 (chart「ユーザー数」表示、biz-charts) | pass (UI 反映部) |

## flaky / fix seed
なし。サーバ間 pull + secret は unit (no-key、env mock) でカバー、UI 反映 (MAU → ユーザー数 chart) は biz-charts E2E で green。pure-backend journey は E2E 非該当を明示。
