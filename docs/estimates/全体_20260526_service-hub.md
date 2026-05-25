---
generated_at: 2026-05-26 08:30
generator: /flow:estimate
context: whole
source_input: ./docs/concept.md
interpreted_as:
  feature: null
  phase: rough
  source: autodetect
phase: rough
confidence_band:
  ai_impl: "±300%"
  human_bottleneck: "±50%"
  ai_tokens: "±30% (設計) / ±50% (実装込み)"
nfr_profile:
  scale: low
  throughput: low
  latency: standard
  availability: none
  source: explicit   # concept §3 由来 (単一ユーザー内部ツール)
calibration:
  global_metrics: "empty (0 サンプル) → デフォルト係数"
  pj_stats: "absent → グローバル 100% / 実質デフォルト"
  band_adjustment: "none (N=0)"
summary:
  min:
    total_files: 34
    total_lines: 2800
    human_hours: 4
    ai_tokens_total: "575K"
  standard:
    total_files: 85
    total_lines: 7000
    human_hours: 8
    ai_tokens_total: "1.43M"
  full:
    total_files: 170
    total_lines: 14000
    human_hours: 16
    ai_tokens_total: "2.86M"
---

# 見積もり: service-hub（全体・初回フェルミ推定）

> SCENARIO §3 Phase 1 完了直後の **1 回目（initial）** 見積もり。phase=rough（concept のみ、provider 実現性 [論点-001] と service-info 契約 [論点-003] が未確定）。
> SCENARIO §3 では最初の 1 feature 完了後に **2 回目（refined）** を再 invoke する想定。

## サマリ表

| スコープ | ファイル数 | コード行数 (logic+test) | 人間時間 | AI 推論トークン (設計+実装) |
|---|---|---|---|---|
| Minimum | 34 | 2,800 | 4h | 設計 55K / 実装 520K = 合計 **575K** (±50%) |
| Standard | 85 | 7,000 | 8h | 設計 130K / 実装 1.3M = 合計 **1.43M** (±50%) |
| Full | 170 | 14,000 | 16h | 設計 260K / 実装 2.6M = 合計 **2.86M** (±50%) |

> **confidence band**: AI-impl **±300%** (phase=rough、provider API 実現性が未検証なため広い) / Human-bottleneck ±50% / AI トークン ±30%(設計)・±50%(実装込み)
> **NFR プロファイル**: scale=low, throughput=low, latency=standard, availability=none（concept §3 由来、単一ユーザー内部ツール）。medium 基準比の NFR 倍率 ≈ 0.5x は**低スケール前提を各ブレークダウンの baseline に織り込み済**（二重割引を避けるため別途乗算しない）。
> **金額換算**: コード行数 × AI コーディングレート、AI 推論トークン × モデル単価（その時期で要確認）で利用側が算出。
> **参考単価 (2026-05 時点想定、要確認)**: Haiku 4.5 ≒ in $0.80 / out $4、Sonnet 4.6 ≒ in $3 / out $15、Opus 4.7 ≒ in $15 / out $75（per 1M tokens）

## 1. 横断フォルダ別ブレークダウン（_shared/*、基盤）

| フォルダ | 主タスク | classification | Min files/lines | Std files/lines | Full files/lines | is_new |
|---|---|---|---|---|---|---|
| _shared/types | ServiceDescriptor / UsageMetric / ProviderKind / SnapshotRow 型 | ai_impl (type) | 1 / 80 | 2 / 200 | 3 / 400 | true |
| _shared/db | Neon スキーマ 3 表 (usage_snapshots/alert_events/collection_runs) + Drizzle + migration | ai_impl (db_schema) | 2 / 160 | 4 / 400 | 6 / 800 | true |
| **_shared/providers** | 共通 ProviderAdapter IF + MVP adapter (ping/Vercel/Neon/Clerk) + service-info adapter（Phase2: Sentry/R2） | ai_impl (api_code) | 6 / 600 | 12 / 1,500 | 22 / 3,000 | true |
| _shared/auth | Clerk 単一ユーザーゲート (seiji のみ許可) | ai_impl (api_code) | 1 / 70 | 2 / 175 | 3 / 350 | true |
| **小計** | | | **10 / 910** | **20 / 2,275** | **34 / 4,550** | |

**根拠**: `_shared/providers` が実装の核かつ最大リスク。各 adapter は「API 呼び出し → パース → UsageMetric 正規化」で Min ~60-100 行。MVP は ping + Vercel + Neon + Clerk + service-info（D20260526-005）、Std で Sentry/R2 + エラーハンドリング + レート制限 + キャッシュ、Full で全 provider の堅牢なフォールバック。**[論点-001]（無料枠使用量 API の実在性）が未解決のため、ここは振れ幅が最大** → rough ±300% の主因。

## 2. 機能フォルダ別ブレークダウン

| フォルダ | 主タスク | classification | Min files/lines | Std files/lines | Full files/lines |
|---|---|---|---|---|---|
| registry | services.toml パーサ + スキーマ検証 + 一覧取得 | ai_impl (api_code) | 2 / 180 | 5 / 450 | 9 / 900 |
| collection | Cron handler + pull runner (services×providers, upsert, run 記録) | ai_impl (api_code) | 2 / 260 | 5 / 650 | 9 / 1,300 |
| dashboard | 全サービス横断サマリ一覧画面 + 取得 hook + API | ai_impl (ui_code) | 3 / 330 | 7 / 825 | 13 / 1,650 |
| service-detail | 個別サービス時系列画面 + チャート + API | ai_impl (ui_code) | 3 / 330 | 7 / 825 | 13 / 1,650 |
| alerts | 閾値判定 + alert_events 記録 + seiji 通知 | ai_impl (api_code) | 2 / 210 | 5 / 525 | 9 / 1,050 |
| **小計** | | | **12 / 1,310** | **29 / 3,275** | **53 / 6,550** |

**根拠**: dashboard / service-detail は Recharts での時系列描画 + TanStack Query で DB スナップショットを読む構成（プロバイダ API を画面で直叩きしない、concept §3 性能方針）。Full は a11y + 多 provider の表示バリエーションで +。E2E は Playwright で自動化（perspectives O33）= ai_impl の e2e_auto に内包、人力 E2E は計上ゼロ。

## 3. 基本部分（12 項目、greenfield のため計上）

| 項目 | Min files/lines | Std files/lines | Full files/lines | 備考 |
|---|---|---|---|---|
| #1 PJ 初期化 (Vite+TS+Tailwind+shadcn+Drizzle) | 5 / 120 | 8 / 250 | 12 / 450 | 設定一式 |
| エラーハンドリング | 1 / 60 | 2 / 150 | 3 / 300 | |
| ログ/監視 (Sentry init) | 1 / 40 | 2 / 120 | 3 / 250 | 監視は Sentry に集約 |
| テスト基盤 (Vitest 設定) | 1 / 40 | 1 / 80 | 2 / 150 | |
| CI/CD (ci.yml + Vercel 自動) | 2 / 90 | 3 / 200 | 4 / 350 | O37 |
| インフラ/デプロイ (Vercel + Cron 設定) | 2 / 60 | 3 / 150 | 4 / 300 | dev.sh/stop.sh 含む(O36) |
| i18n / a11y / perf | 0 / 0 | 1 / 100 | 4 / 400 | 内部ツールで i18n なし、a11y/perf 最小 |
| **小計** | **12 / 410** | **20 / 1,050** | **32 / 2,200** | 認証は _shared/auth に計上 |

## 4. NFR 倍率の効き

| NFR 軸 | 値 | medium 比倍率 | 影響 |
|---|---|---|---|
| scale | low | 0.7x | 単一ユーザー・低 volume、シャーディング/負荷対策不要 |
| throughput | low | 0.8x | 低頻度 pull (日次〜数時間) |
| latency | standard | 1.0x | ダッシュボード UX は確保 |
| availability | none | 0.9x | ベストエフォート、HA 不要 |

合計 NFR 倍率 ≈ **0.5x**（medium 基準比）。**ただし本見積の各 baseline は既に内部・低スケール前提で算定済のため、二重割引回避として別途は乗算していない**（NFR の効きは baseline に織り込み済と明記）。

## 5. 根拠サマリ（重要 5 件）

1. **`_shared/providers` が最大の不確実性**: 各 PaaS が「無料枠使用量」を read-only API で出すかは未検証（[論点-001]）。出ない指標は ping/間接指標で代替 or 表示対象外になり、規模が大きく振れる → これが rough ±300% の主因。
2. **pull アーキで画面側は薄い**: ダッシュボードは DB スナップショットを読むだけ（concept §3 性能方針）。重い API オーケストレーションは collection に集約。
3. **service-info 契約のクロスサービス波及は本見積の対象外**: HUB 側の adapter（_shared/providers に内包）は計上、各サービス側の実装（hana-memo retrofit 等）は各サービスの見積で別計上（二重計上回避）。
4. **E2E は自動化前提**（O33）: 人力 E2E は計上ゼロ。人間時間は「実 read-only トークン取得 + provider 別スモーク + ダッシュボード目視 + [論点-001] API 調査」が主。
5. **全て無料枠**: 金額は AI コーディングレート + モデル単価依存。インフラ運用費は $0（concept §4.4）。

## 6. 二重計上回避

| 横断フォルダ | 状態 | 計上 |
|---|---|---|
| _shared/{types,db,providers,auth} | 新規 | 計上（greenfield） |
| 各マイクロサービス側の service-info 実装 | 別 PJ の責務 | **計上ゼロ**（service-hub 見積には含めない、各サービス見積で計上） |

## 7. AI 推論トークン内訳（フェルミ推定、Std）

- **設計フェーズ ~130K**: concept NEW 13K（済）+ feature 9 フォルダ × ~10K = 90K + secure ~11K + audit light ~13K
- **実装フェーズ ~1.3M**: tdd セッション ~12 回（一部 feature は複数 Phase）× ~110K/session（metrics-tracking 経験則。global-metrics 空のためデフォルト経験則を採用）
- Min ≈ 0.4×、Full ≈ 2×。実装フェーズの loop_factor 不確実性で ±50%。

> 注: `global-metrics.jsonl` が空のため、実測キャリブレーション未適用。最初の feature/tdd 完了後（SCENARIO §3 2 回目）に実 LOC/tokens を取り込んで refined 再見積もりすると band が大きく縮む。
