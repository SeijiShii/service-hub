# E2E テストレポート: collection (refresh-cadence — 15min-and-last-updated)

- **状態**: E2E green
- **FW**: Playwright (chromium headless、route-mock、Class A)
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
「最終更新」表示 + 手動補完 (force-pull で鮮度更新) の UI 経路を E2E で検証。15min cron cadence 自体はサーバ設定 (vercel.json crons) + unit でカバー (E2E 対象外)。

## journey 別結果
| 004 journey | spec | 結果 |
|---|---|---|
| 最終更新の表示 (dashboard header) | dashboard.spec.ts UC1-S1 (summary 表示) | pass |
| E-LU-04: force-pull で鮮度補完 → 最終更新更新 | dashboard.spec.ts DA-FP (force-pull → 結果サマリ) | pass |
| 15min cron cadence | (E2E 対象外) vercel.json crons + cron/collect unit | n/a (設定/unit) |

## flaky / fix seed
なし。cron スケジュール自体は時間依存のため headless E2E 対象外、設定 (crons) + cron/collect ハンドラ unit でカバー。手動補完経路 (force-pull) は DA-FP で green。
