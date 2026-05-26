# _shared/types 実装計画書

> **入力**: `./001_types_SPEC.md`, `../../concept.md` §1.4 / §4.3
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/types/）

| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/types/service.ts` | ServiceDescriptor / ProviderRefs / ServiceInfoRef / Thresholds / ServiceStatus | なし | ~50 |
| `src/types/provider.ts` | ProviderKind / 定数配列(PROVIDER_KINDS, MVP_PROVIDERS) / ProviderAdapter / 型ガード | service.ts | ~40 |
| `src/types/metric.ts` | MetricKey / UsageMetric / SnapshotRow | provider.ts | ~30 |
| `src/types/alert.ts` | AlertEvent / CollectionRun / CollectionStatus | provider.ts | ~25 |
| `src/types/index.ts` | re-export（バレル） | 上記 | ~10 |
| `src/types/guards.ts` | isProviderKind / isServiceStatus / isCollectionStatus | provider.ts | ~25 |

> 言語=TypeScript（concept §4.3）。純型 + ガード + 定数のみ、ランタイム依存なし。

## 2. 実装 Phase 分割（/flow:tdd 連携）

### Phase 1 (RED→GREEN→IMPROVE): 列挙・定数・型ガード
- 対象: `provider.ts`（ProviderKind, PROVIDER_KINDS, MVP_PROVIDERS, isProviderKind）, `service.ts`（ServiceStatus, isServiceStatus）, `guards.ts`
- テスト対象: 型ガードの true/false 判定（実行時挙動があるのはガードのみ）
- ゴール: ガードが正しく narrowing、定数配列が ProviderKind を網羅

### Phase 2: 構造型 + バレル
- 対象: ServiceDescriptor / UsageMetric / SnapshotRow / AlertEvent / CollectionRun / ProviderAdapter / index.ts
- テスト対象: 型は typecheck で担保（型レベルテスト = `tsd` or `// @ts-expect-error` パターン）。バレル export の存在確認。
- ゴール: `tsc --noEmit` green、全型が index から import 可能

> 外部 SDK 統合なし → Phase 3.5 bootstrap は本フォルダでは不要（providers/collection 側で実施）。

## 3. 依存関係順序
```
service.ts ─┐
provider.ts ─┼─→ metric.ts, alert.ts ─→ index.ts
guards.ts  ─┘
```
循環なし。

## 4. 既存ファイルへの影響
なし（新規フォルダ。greenfield、これが最初の実装対象）。PJ scaffold（package.json/tsconfig/vite）が未生成のため、**最初の tdd 対象が scaffold も兼ねる**（Phase 1 で最小 tsconfig + vitest 設定を含む）。

## 5. 横断フォルダへの追加・変更
本フォルダ自身が横断の起点。被依存: _shared/db, _shared/providers, registry, collection, dashboard, service-detail, alerts（全て本型を import）。

## 6. リスク・注意点
- **MetricKey の open union**: `(string & {})` で拡張余地を残すが、既知キーは KnownMetricKey に集約し typo を防ぐ。
- **scaffold 兼任**: greenfield のため、本フォルダの tdd で tsconfig/vitest を初期化する（concept §1.4 の構成に合わせる）。
- service-info 型（[論点-T1]）は [論点-003] 確定まで `ServiceInfoRef`（接続情報）に留め、`ServiceInfoResponse` は後日追加。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、`tsc --noEmit` green
- [ ] 型ガードの unit テスト green（カバレッジ目標達成）
- [ ] index.ts から全公開型が import 可能
- [ ] E2E: 対象外（cross-cutting、統合テストは利用側 feature の E2E でカバー）

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
