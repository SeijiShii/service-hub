# 修正計画: snapshot conflict key 衝突 (C20260601-003)

## 方針
upsert の last-wins 意味論 (ON CONFLICT DO UPDATE + latestPerService の DISTINCT ON ... captured_at DESC、いずれも provider 非識別子) に合わせ、**insert 前に同一 conflict key `(service_slug, metric_key, captured_at)` を後勝ち dedup**。migration 不要・downstream 不変・可逆。

## 修正対象
| ファイル | 修正 |
|---|---|
| `src/db/queries.ts` | `dedupeByConflictKey()` 追加 + `upsertSnapshots` で `.values(dedupeByConflictKey(rows)...)` |

## 不採用案
- (A) unique constraint に provider 追加: migration 必要 + downstream (DISTINCT ON / timeseries) が provider 非識別子のため二重点を生み別バグ化。
- (B) runner で dedup: DB 境界の方が全 caller を守れる。

## DoD
- [x] DB-FX-003 (複数 provider 同一 metric → 1 行 last-wins) green
- [x] 既存 upsert/latest テスト維持 (315 green)
- [ ] 12th deploy + 本番 collect 成功確認

## 対象外メモ
`hana-memo / service-info / http_500` は service-info adapter 側の別事象 (本 fix は DB insert 衝突に限定)。収集が動き出せば再観測して別途 claim/fix 判断。
