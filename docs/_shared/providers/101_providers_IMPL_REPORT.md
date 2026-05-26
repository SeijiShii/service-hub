# _shared/providers 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（/flow:auto Phase3 反復3）/ **状態**: 完了（GREEN）

## 実装ファイル（src/providers/）
| ファイル | 内容 |
|---|---|
| fetch.ts | safeFetch(timeout/redirect manual/SSRF 内部アドレス抑止) + scrubSecrets([論点-004]/O25) + isInternalUrl |
| adapters.ts | wrap() 共通(throw せず {metrics,error})、ping/vercel/neon/clerk/service-info adapter（fetch 注入=O35） |
| index.ts | getAdapters(service, deps): providers/serviceInfo から有効 adapter 構築（ping 常時） |

## 設計反映 / 論点
- [論点-001]: MVP=ping/vercel/neon/clerk + service-info。CF/Sentry は Phase2（未実装、getAdapters で除外）。
- [論点-003]/[論点-T1]: service-info adapter が ServiceInfoResponse をパース（schemaVersion 後方互換、status→up + metrics 正規化）。
- [論点-004]: 外向き fetch を safeFetch に集約（内部アドレス抑止 + タイムアウト）。
- **型変更**: `ProviderKind` に `"service-info"` を追加（pull 源として正式化）。PROVIDER_KINDS=7 / MVP_PROVIDERS に追加。types テストも更新。
- エラー: auth(401/403)/rate_limited(429)/timeout/http_N を error で返す（部分成功）。

## 検証
- `npm run test`: 37 passed（providers 16 + db 8 + types 13）/ `npm run typecheck`: green。
- 実 API 形状の最終確認は /flow:release Phase2（実 read-only トークン）。
