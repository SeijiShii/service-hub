# _shared/providers 実装計画書

> **入力**: `./001_providers_SPEC.md`, `../types/`, `../../concept.md` §6
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/providers/）

| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/providers/fetch.ts` | 安全 fetch（timeout/redirect 制限/内部アドレス抑止）+ 秘密スクラブ | types | ~70 |
| `src/providers/ping.ts` | uptime ping adapter | fetch, types | ~40 |
| `src/providers/vercel.ts` | Vercel deploy adapter | fetch, types | ~60 |
| `src/providers/neon.ts` | Neon storage/compute adapter | fetch, types | ~60 |
| `src/providers/clerk.ts` | Clerk user count adapter | fetch, types | ~50 |
| `src/providers/serviceInfo.ts` | service-info adapter（共有シークレット、ServiceInfoResponse パース） | fetch, types | ~70 |
| `src/providers/cloudflare.ts` | R2 adapter（Phase2、stub 可） | fetch, types | ~50 |
| `src/providers/sentry.ts` | error_count adapter（Phase2、stub 可） | fetch, types | ~50 |
| `src/providers/index.ts` | getAdapters(service) + バレル | 上記 | ~30 |

## 2. 実装 Phase 分割（/flow:tdd、O35 injectable default）

### Phase 1: 安全 fetch ユーティリティ + ping
- 対象: fetch.ts（timeout/redirect/内部アドレス抑止/スクラブ）, ping.ts
- テスト: fetch のタイムアウト/リダイレクト制限/スクラブ、ping の up/down 判定（mock サーバ or msw）

### Phase 2: PaaS adapter（mock 注入、実 SDK は最終）
- 対象: vercel/neon/clerk/serviceInfo（MVP 4 + service-info）
- **O35 injectable**: adapter は fetch を注入（interface）、テストは mock レスポンスで通過。実 API 形状は固定 fixture で検証。
- テスト: 各 adapter の正規化（API JSON → UsageMetric[]）、エラー時 `{metrics:[], error}`、raw_json スクラブ、service-info の schemaVersion 後方互換

### Phase 3: getAdapters + Phase2 adapter stub
- 対象: index.ts（service.providers から有効 adapter 選択）, cloudflare/sentry（stub or 実装）

### Phase 3.5: 実 SDK/トークン結合（最終、実キーは release 工程）
- 実 read-only トークンでの疎通は **/flow:release Phase 2**（実キー軽めスモーク）に委ねる。ここまでは mock/fixture で green。

## 3. 依存関係順序
```
types → fetch.ts → {ping,vercel,neon,clerk,serviceInfo,cloudflare,sentry}.ts → index.ts
```

## 4. 既存ファイルへの影響
- **`_shared/types` に `ServiceInfoResponse`/`ServiceInfoStatus` を追加**（[論点-T1] 解決、本フォルダ実装時に types も更新）。

## 5. 横断フォルダへの追加・変更
collection が `getAdapters(service)` + `collect()` を利用。

## 6. リスク・注意点
- **[論点-001]**: 各 PaaS の実 API レスポンス形状は実トークンで要確認（fixture は公開ドキュメント基準で作成、release Phase2 で実値検証）。
- **SSRF/fetch 安全性**（[論点-004]）: fetch.ts に集約（全 adapter が経由）。
- **レート制限**: 同時実行数を抑制（collection 側の並列度制御と協調）。
- **秘密スクラブ**: raw_json 格納前に必須。

## 7. 完了の定義（DoD）
- [ ] MVP adapter（ping/vercel/neon/clerk/serviceInfo）+ fetch.ts 実装、mock/fixture で green
- [ ] getAdapters が service.providers から正しく選択
- [ ] エラー時 throw せず {metrics,error}、raw_json スクラブ確認
- [ ] types に ServiceInfoResponse 追加（typecheck green）
- [ ] 実トークン疎通は /flow:release Phase2 に委譲（ここでは mock）
- [ ] E2E: 対象外（cross-cutting）

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
