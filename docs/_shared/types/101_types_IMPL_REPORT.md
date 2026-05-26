# _shared/types 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（/flow:auto Phase3 反復1）/ **状態**: 完了（GREEN）

## 実装ファイル（src/types/）
| ファイル | 内容 |
|---|---|
| provider.ts | ProviderKind / PROVIDER_KINDS / MVP_PROVIDERS / ProviderAdapter |
| service.ts | ServiceStatus / ProviderRefs / ServiceInfoRef / ServiceInfoResponse / Thresholds / ServiceDescriptor |
| metric.ts | KnownMetricKey / MetricKey(open) / UsageMetric / SnapshotRow |
| alert.ts | CollectionStatus / AlertEvent / CollectionRun |
| guards.ts | isProviderKind / isServiceStatus / isCollectionStatus |
| index.ts | バレル re-export |

## scaffold（greenfield 初期化、本 tdd が兼任）
- `package.json`（type:module、scripts: test/test:watch/typecheck、devDeps: typescript/vitest/@types/node）
- `tsconfig.json`（strict、bundler resolution、`@/*` パス）/ `vitest.config.ts`

## 設計反映
- 秘密は env 参照名のみ保持（値を持たない、O25 / 905 R1）。日時は ISO string。rawJson は unknown。
- MetricKey は open union（Phase2 拡張対応）。ServiceInfoResponse（[論点-003]/[論点-T1] 確定分）実装。

## 検証
- `npm run test`: 13 passed / `npm run typecheck`: green。
