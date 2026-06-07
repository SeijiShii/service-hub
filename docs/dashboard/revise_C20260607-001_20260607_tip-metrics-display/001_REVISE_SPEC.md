# dashboard 変更仕様書（収益(revenue)指標を一覧に表示 + 契約キー正規化）

> **改修種別**: 機能拡張（表示追加）+ 契約キー改名（後方互換あり）
> **issue / slug**: C20260607-001 / tip-metrics-display（収益化に伴い実体は revenue-metrics-display）
> **基準 SPEC**: `../001_dashboard_SPEC.md`
> **起点クレーム**: `../claim_C20260607-001_20260607_tip-metrics-display/001_TRIAGE.md`（判定: 仕様検討漏れ、decision D20260607-003）
> **最終更新**: 2026-06-07
> **タグ**: analytics（集計表示、PII なし O48）

---

## 1. 変更概要

producer が service-info で自己申告する累計収益（件数・金額）を dashboard 一覧の各サービス行に表示する。

当初 producer (bousai-bag-checker) は `tip_count` / `tip_total_yen`（投げ銭）名で本番申告したが、
**収益の源泉はサービスにより寄付・売上・投げ銭等さまざま**であり「投げ銭」は不適切（ユーザー指摘）。
そのため service-hub（契約 SoT）の canonical キーを汎用 **`revenue_count` / `revenue_total_yen`** とし、
表示ラベルも **「収益」** とする。**旧 `tip_*` キーでの申告は後方互換として adapter で canonical へ正規化**し、
producer の強制再デプロイを不要にする。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 一覧サマリ | status/service/MAU/採算/離脱率/errors/alerts/最終デプロイ | 上記に加え **収益(件) / 収益(¥)** を additive 表示 | producer 申告の収益指標を可視化 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `service-info` adapter (`adapters.ts`) | metrics[] の key をそのまま emit | 旧 `tip_count`→`revenue_count` / `tip_total_yen`→`revenue_total_yen` に正規化（`LEGACY_METRIC_KEY_ALIAS`）、それ以外は素通り | 互換（旧名・新名どちらの申告も受理） |
| dashboard テーブル (`DashboardView.tsx` thead) | 8 列 | 10 列（末尾に 収益(件) / 収益(¥)） | 互換（additive） |
| サービス行 (`ServiceRow.tsx`) | 8 セル | 10 セル（`revenue_count` / `revenue_total_yen` を参照、`data-revenue-count` / `data-revenue-yen`） | 互換 |
| 公開 API `/api/dashboard/summary` | — | スキーマ不変（VM は generic に revenue_* を保持） | 互換 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `KnownMetricKey` (`metric.ts`) | `revenue_count` / `revenue_total_yen` を追記（canonical）。`tip_*` は **追加しない**（adapter で正規化されるため DB には現れない） | 不要 |
| `ServiceInfoResponse` (`service.ts`) | metrics[] の doc に canonical=revenue_* + 旧 tip_* 受理（正規化）を明記。型構造は不変（key:string） | 不要 |
| `usage_snapshots` | スキーマ不変。今後は canonical `revenue_*` で保存される（旧 tip_* で申告されても正規化後に保存） | 不要 |

> **既存 tip_* スナップショットの扱い**: producer の本番投入が 2026-06-07 当日で、保存済の tip_* 行は最小（検証時の 1 件程度）。次回 collection で revenue_* が上書き蓄積される。過去 tip_* 行の遡及変換は不要（表示は最新 latestPerService 由来、旧キーは自然に陳腐化）。データ移行なし。

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| 収益値の表示 | （列なし） | 未申告/欠落は `—`、`revenue_total_yen` は `¥{value}`（jpy 固定）、`revenue_count` は数値。0 は有効値（`¥0`/`0`） |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/providers/adapters.ts` | 高 | 旧→canonical 正規化エイリアス追加 |
| `src/features/dashboard/ServiceRow.tsx` | 高 | 収益 2 セル追加 |
| `src/features/dashboard/DashboardView.tsx` | 中 | thead に 収益(件)/収益(¥) |
| `src/types/metric.ts` | 中 | KnownMetricKey に revenue_* 追記 |
| `src/types/service.ts` | 低 | ServiceInfoResponse doc 更新 |
| 収集経路 / DB / VM / 公開 API スキーマ | なし | generic 保持・スキーマ不変 |
| **producer (bousai-bag-checker)** | 低（任意） | tip_* → revenue_* への移行は**任意**（後方互換 alias により未移行でも機能）。クリーンアップとして推奨、cross-repo follow-up で起票 |

## 4. 後方互換性

- **互換維持**: ✅
- producer は旧 `tip_*` 名のまま申告し続けても、adapter が canonical `revenue_*` へ正規化するため表示は即時機能。
- producer が将来 `revenue_*` に移行しても native 受理。**移行は強制ではない**（cross-repo の同期デプロイ不要）。
- additive 列追加のみ。既存列・API・DB スキーマ不変。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅（表示層 + adapter alias + 型、DB 変更なし）
- **DB マイグレーションのロールバック**: 無
- **手順**: 該当コミットを revert。収集データ・producer に影響なし。

## 6. リリース戦略

- **方式**: 一括（小規模 additive + alias、フラグ不要）
- **ロールアウト**: 通常デプロイ。producer は既に tip_* を本番申告済 → デプロイ後ただちに当該サービス行に `収益(件)=1 / 収益(¥)=¥100` が正規化表示される。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- 一覧 (`/`) の各行末尾に「収益(件)」「収益(¥)」。値は `ServiceRowVM.metrics.revenue_count` / `.revenue_total_yen`。
- 未申告（キーなし=undefined）は `—`。申告ありの 0 は有効値（`revenue_count`→`0`、`revenue_total_yen`→`¥0`）。

### 7.2 入出力
- 表示のみ。`¥` 接頭は jpy 固定（producer の unit:jpy 前提）。整数表示。

### 7.3 データモデル
- §2.3 の通り。adapter 正規化は `LEGACY_METRIC_KEY_ALIAS = { tip_count→revenue_count, tip_total_yen→revenue_total_yen }`。

### 7.4 バリデーション・エラー
- unit が想定外でも値は表示（collection 層で正規化済、HUB は producer 申告を信頼）。¥ 固定。

### 7.5 機能固有 NFR + 既存連携
- 一覧性維持（compact 行、右寄せ mono）。PII なし（集計値のみ、O48）。

## 8. タグ別追加項目（analytics）
- 集計値のみ・PII なし。

## 9. 未決事項

### [論点-001] 上部 chart への収益系列追加
- **推奨**: 今回スコープ外（案A）。まず一覧で close、chart 化は需要を見て別 revise。

### [論点-002] producer (bousai-bag-checker) の tip_* → revenue_* 移行
- **影響範囲**: producer service-info 実装（別 repo）
- **詰めるべき問い**: 後方互換 alias がある今、producer を revenue_* に移行するか
- **推奨**: cross-repo follow-up で**任意の cleanup として起票**（機能上は不要、ログ/契約のクリーンさのため推奨）。期限なし。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-07 | 初版作成（claim ハンドオフ、当初は tip 表示のみ・契約変更不要の想定） | /flow:revise |
| 2026-06-07 | ユーザー指摘で収益化: 表示ラベル 投げ銭→収益、契約 canonical を revenue_*、旧 tip_* は adapter で後方互換正規化。scope に契約改名 + adapter を追加 | /flow:tdd (feedback) |
