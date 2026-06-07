# 調査・根本原因: producer の unit 欠落で collect 全 insert 失敗 (C20260607-002)

**発生日**: 2026-06-07
**重大度**: high (本番 collect 全停止、C20260601-003 と同系の all-or-nothing batch 障害)
**起点**: naze-bako を新規追加後、collection_run が status=failed (errors[].serviceSlug="*")

## 症状
`insert into "usage_snapshots" ... do update` が失敗し、**全サービスの snapshot が 1 件も保存されない** (batch all-or-nothing)。

## 根本原因
- **producer (naze-bako) の service-info が一部 metric に `unit` を含めず申告** (mau / users_total / users_verified / questions_total / investigations_24h / errors_24h)。= 契約違反 (`ServiceInfoResponse.metrics[]` は `{key,value,unit}` 必須)。
- HUB の runner (`src/features/collection/runner.ts:57`) が `unit: m.unit` を**そのまま通し**、`undefined` が `usage_snapshots.unit`(`text NOT NULL`、default なし、`schema.ts:47`) に渡ると drizzle が SQL `default` を出力 → **NOT NULL 制約違反**。
- batch insert は all-or-nothing のため、1 producer の不備で**全サービスの collect が巻き添えで失敗** (bousai/hana-memo も観測不能に)。C20260601-003 (conflict key 衝突) と同じ「1 行の不正で全 collect 死」クラス。

## 修正 (HUB resilience、永続境界で sanitize)
`runner.ts` の row 構築時:
- `unit`: `typeof m.unit === "string" ? m.unit : ""` で欠落を矯正 (NOT NULL 充足、値は保持)。
- `value`: `!Number.isFinite(m.value)` の metric は warn して skip (数値カラムを壊さない別ベクタも封鎖)。
→ 1 producer の不正申告が全 collect を落とさない。リグレッション: `CO-RES-01`。

## producer 側 follow-up (別 repo、任意だが推奨)
naze-bako は契約に従い全 metric に `unit` を付すべき (hana-memo の sales_* 同様、producer 側で契約遵守)。HUB 矯正は防御であり契約遵守の代替ではない。
