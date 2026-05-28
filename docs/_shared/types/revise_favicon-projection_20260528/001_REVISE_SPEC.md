# _shared/types 変更仕様書（favicon-projection: service-info contract に iconUrl を追加し公開 DTO に投影）

> **改修種別**: 拡張（対外契約 `ServiceInfoResponse` を v1→v2 に bump + 公開安全 DTO `PublicServiceStatus` に iconUrl 追加）
> **issue / slug**: favicon-projection
> **基準 SPEC**: `../001_types_SPEC.md`（ServiceInfoResponse 初版 schemaVersion=1）
> **アンカー**: `_shared/types`（contract 主体）。横断: providers / db / _shared/auth (public-status) / registry (DB schema 追加のみ、admin UI は不変)
> **連動 PJ**: **bousai-bag-checker** (現状唯一の service-info producer、本セッション後に同 slug で連動 revise 起動推奨)。将来登録される全マイクロサービスも同様
> **最終更新**: 2026-05-28
> **タグ**: cross-cutting (型 + 公開 DTO)
> **AI_LOG**: `../../../AI_LOG/D20260528_019_revise__shared_types_favicon-projection.md`
> **対外契約変更フラグ**: yes (CF-20260528-016 で flow:revise §Step 3.1 改修固有 6 項目 (F) として人為的に補完運用)

---

## 1. 変更概要

公開ショーケース (shipyard) がサービス一覧でアイコンを並べて表示できるよう、**各マイクロサービスの自己申告契約 `ServiceInfoResponse` (v1 → v2) に `iconUrl?: string` を追加**し、service-hub の `services` テーブルに保存、公開 API `/api/public/status` のレスポンス DTO `PublicServiceStatus` に投影する。各 producer (= 各マイクロサービス) は自分の favicon の絶対 URL を申告する責任を持つ。取得不可時は consumer (shipyard) 側でフォールバックアイコン表示。

**設計の核**: 内部完結 (HTML parse 等) を避け、producer 側に "自分の favicon パスは自分が一番知っている" 原則で責任を持たせる。SPA の `/favicon.ico` rewrite 等の脆い推測ロジックを service-hub に持ち込まない。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| PS-UC1 (公開稼働一覧取得) | `{slug, name, url, status, lastCheckedAt?}` 配列を返す | 同じ shape に **`iconUrl?: string`** が optional で追加 | shipyard 等 consumer がアイコン表示で利用 |
| SI-UC1 (service-info 自己申告 = producer 側) | producer は `{schemaVersion: 1, service, status, metrics?, version?, extra?}` を返す | producer は **`schemaVersion: 2` + `iconUrl: <絶対 URL>`** を返す (旧 v1 producer も受信側で許容) | service identity を contract で申告 |
| (新規) SI-UC2 (service-hub 側 iconUrl 永続化) | (なし) | cron collect 時、service-info adapter で受信した iconUrl を `services.icon_url` に upsert | 公開 DTO 投影元データとして永続化 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `ServiceInfoResponse` (対外契約 v1) | `schemaVersion: number, service, status, metrics?, version?, extra?` | `schemaVersion: number, service, status, metrics?, version?, **iconUrl?: string**, extra?` (v2 で iconUrl 明示追加) | **後方互換: ✅** — schemaVersion=1 受信時 iconUrl 無し → undefined として許容、v2 でも iconUrl optional (producer が落として返しても受信可) |
| `PublicServiceStatus` (公開 DTO) | `{slug, name, url, status, lastCheckedAt?}` | `{slug, name, url, status, lastCheckedAt?, **iconUrl?: string**}` | **後方互換: ✅** — additive、既存 consumer は無視可能 |
| `GET /api/public/status` レスポンス | 上記 DTO 配列 (iconUrl 無し) | 同じ shape に iconUrl が optional 追加 | additive、既存 consumer 影響なし |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `services` テーブル | **`icon_url text` カラム追加** (nullable) | **必要** (005_REVISE_MIGRATION.md で詳細) |
| `usage_snapshots` テーブル | 変更なし (iconUrl は時系列ではない、static identity 属性) | 不要 |
| `ServiceDescriptor` 型 | `iconUrl?: string` フィールド追加 | 型変更のみ |
| `ServiceInfoResponse` 型 | `iconUrl?: string` フィールド追加 + JSDoc に v2 schemaVersion bump 説明 | 型変更のみ |
| `PublicServiceStatus` 型 | `iconUrl?: string` フィールド追加 | 型変更のみ |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| service-info adapter (受信 parse) | `schemaVersion` を number として要求、それ以外緩く受信 | 同左 + iconUrl が string でかつ URL 形式 + `https://` で始まる + 1024 chars 以内なら採用、それ以外は無視 (parse 失敗にはしない、producer ミス耐性) |
| `serviceDescriptorSchema` (admin write 検証) | iconUrl 無し | iconUrl は admin write 経路では受け付けない (producer 自己申告のみが SoT) — admin UI から手動編集禁止 |
| `services.icon_url` DB 保存時 | (カラム無し) | DB レベルの constraint は無し (nullable text)、adapter 側で format check 後に upsert |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `_shared/types` (本体) | **高** | ServiceInfoResponse + PublicServiceStatus + ServiceDescriptor の型に iconUrl 追加 |
| `_shared/providers` (service-info adapter) | **高** | createServiceInfoAdapter で受信 iconUrl を抽出、新規 `updateServiceMeta(db, slug, iconUrl)` を呼び出して services テーブル update |
| `_shared/db` (schema + queries) | 中 | services テーブルに icon_url カラム追加、`upsertService` に iconUrl 反映、`toServiceDescriptor` に追加、`updateServiceMeta(slug, iconUrl)` 新設 |
| `_shared/auth` (public-status) | 中 | `buildPublicStatus` で `svc.iconUrl` を DTO に投影 (1 行追加) |
| `api/public/status.ts` | 低 | ロジック変更なし (DTO 拡張は内部で完結) |
| `api/cron/collect.ts` | 低 | 既存 cron path で service-info adapter が自動的に iconUrl 更新するため変更なし |
| `registry` admin write 経路 | **無し** | iconUrl は producer 自己申告 SoT、admin UI から手動編集しない方針 (誤上書き防止) |
| 連動 PJ: bousai-bag-checker | **高** | `ServiceInfoResponse` 型を v2 に上げ、`iconUrl: 'https://bousai-bag-checker.givers.work/favicon.svg'` (実値は確認) を返却。本セッション後に同 slug で連動 revise 起動 |
| 連動 PJ: shipyard (consumer) | 中 | `<img src={status.iconUrl ?? fallback}>` で表示、onError でフォールバック (shipyard 側の改修であり本 PJ の責務外) |
| 将来登録される全 producer PJ | 中 | v2 contract に iconUrl 必須対応 — concept §1.4 or perspectives に登録時の要件として追記推奨 |

## 4. 後方互換性

- **互換維持**: ✅ **完全な additive 後方互換**
- v1 producer (現状の bousai-bag-checker) が schemaVersion=1 + iconUrl 無しで返しても、service-hub は parse 成功 → `services.icon_url` = NULL のまま
- v2 producer が iconUrl 付きで返したら → `services.icon_url` 更新
- v2 producer が iconUrl 無しで返したら (v2 だが画像未準備) → `services.icon_url` = NULL のまま (既存値はそのまま、null 上書きしない / **詳細は 002_REVISE_PLAN.md でロジック決定**)
- 公開 API consumer (shipyard 等) は iconUrl が optional のため、未送信時はフォールバックすればよい

**非互換変更**: なし。schemaVersion は 1→2 bump するが、receiver は両方許容するため breaking ではない。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅ (型追加 + 1 カラム追加のみ)
- **DB マイグレーションのロールバック**: ✅ あり (`ALTER TABLE services DROP COLUMN icon_url;` — 005_REVISE_MIGRATION.md §3)
- **手順**:
  1. git revert (型 + adapter + buildPublicStatus)
  2. DB migration rollback (icon_url カラム削除)
  3. 公開 API DTO は automatically 旧形式に戻る (型から iconUrl 消失)
- **データ消失リスク**: icon_url カラム削除すると保存済 URL は失われるが、次回 cron collect で producer から再取得できるため**永続的損失なし** (producer 側が依然 v2 で返している限り)

## 6. リリース戦略

- **方式**: **段階的** (フィーチャーフラグ不要、後方互換が完全)
- **ロールアウト**:
  1. **service-hub 側を先行リリース** (型 + adapter + DB migration + buildPublicStatus + 公開 DTO)
     - 既存 v1 producer (bousai-bag-checker) から iconUrl が来なくても問題なし、`icon_url=NULL` で運用継続
  2. **bousai-bag-checker 側で連動 revise 実装 + リリース** (schemaVersion=2 + iconUrl 申告)
     - service-hub の次回 cron collect で `services.icon_url` 更新
  3. **shipyard 側で iconUrl 利用 + フォールバック実装** (本 PJ の責務外、shipyard 側 PJ で別 revise)
  4. **将来登録 producer はすべて v2 contract で登録**
- **フィーチャーフラグ**: 不要 (additive 後方互換)

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）

- **SI-UC1 (producer 自己申告、変更あり)**: 各マイクロサービスが `GET /api/hub/service-info` で `schemaVersion: 2, service, status, metrics?, version?, iconUrl?: <絶対 URL>, extra?` を返す。iconUrl は producer が `${self.url}/favicon.svg` 等の絶対 URL を組み立てて固定値で返却 (動的解決不要)。
- **SI-UC2 (service-hub 側 iconUrl 永続化、新規)**: cron collect 時、`createServiceInfoAdapter` が受信 ServiceInfoResponse から iconUrl を抽出 → format check 通過なら `updateServiceMeta(db, svc.slug, {iconUrl})` で `services.icon_url` を upsert。
- **PS-UC1 (公開 API、変更あり)**: `GET /api/public/status` レスポンスに各 service の `iconUrl?: string` (services.icon_url から投影) が optional で含まれる。
- **その他既存 UC**: **変更なし** (dashboard 内部表示、収集、アラート等は iconUrl を読まないため)。

### 7.2 入出力（新仕様）

**ServiceInfoResponse v2 契約 (producer → service-hub)**:
```ts
interface ServiceInfoResponse {
  schemaVersion: 2;  // bump (v1 受信も許容)
  service: string;
  status: 'ok' | 'degraded' | 'down';
  metrics?: Array<{ key: string; value: number; unit: string }>;
  version?: string;
  iconUrl?: string;  // **新規**: producer の favicon 絶対 URL ('https://...' 1024 chars 以内)
  extra?: Record<string, unknown>;
}
```

**PublicServiceStatus 公開 DTO (service-hub → 公開 consumer)**:
```ts
interface PublicServiceStatus {
  slug: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'unknown';
  lastCheckedAt?: string;
  iconUrl?: string;  // **新規**: services.icon_url から投影
}
```

**ServiceDescriptor (内部 registry 型)**:
```ts
interface ServiceDescriptor {
  slug: string;
  name: string;
  url: string;
  subdomain?: string;
  status: ServiceStatus;
  providers: ProviderRefs;
  serviceInfo?: ServiceInfoRef;
  thresholds?: Thresholds;
  iconUrl?: string;  // **新規**: producer 自己申告で更新される (admin write 経路では設定不可)
}
```

**`GET /api/public/status` レスポンス例 (v2)**:
```json
[
  {
    "slug": "hana-memo",
    "name": "花メモ",
    "url": "https://hana-memo.givers.work/",
    "status": "up",
    "lastCheckedAt": "2026-05-28T05:07:31.725Z",
    "iconUrl": "https://hana-memo.givers.work/favicon.svg"
  }
]
```

### 7.3 データモデル（新仕様）

- `services` テーブル: `icon_url text` カラム追加 (nullable、default NULL)
- `usage_snapshots` テーブル: 変更なし
- **更新経路の SoT 制約**: `services.icon_url` の書き込みは **service-info adapter (producer 自己申告) のみ** とする。admin write 経路 (`serviceDescriptorSchema` / admin API) では iconUrl を受け付けない (誤上書き / SoT 衝突を防ぐ)。

### 7.4 バリデーション・エラー（新仕様）

| ケース | 振る舞い |
|---|---|
| producer が iconUrl 無しで送信 | services.icon_url は変更しない (既存値保持) — 詳細ロジックは 002_REVISE_PLAN.md §5 で確定 |
| producer が iconUrl = "" (空文字) で送信 | format check fail → 無視、既存値保持 |
| producer が iconUrl = "http://..." (http) で送信 | format check fail (https 必須) → 無視、既存値保持 |
| producer が iconUrl = 1024 chars 超で送信 | format check fail → 無視、既存値保持 |
| producer が iconUrl = "javascript:..." 等の不正 URL | format check (URL parse + protocol 検証) で fail → 無視 |
| producer が iconUrl に内部アドレス指定 (http://10.x.x.x/...) | format check fail (publicUrl 相当の SSRF 予防) → 無視 |
| 公開 API consumer (shipyard) が iconUrl を受信できない | DTO で undefined → consumer 側でフォールバックアイコン表示 |
| services.icon_url が NULL (producer 未対応) | 公開 DTO で iconUrl=undefined → 同上 |

### 7.5 機能固有 NFR + 既存連携

| 項目 | 目標値 | 根拠 |
|---|---|---|
| 取得頻度 | cron 1 日 1 回 (既存 cron に乗る) | リアルタイム性不要、static identity 属性 |
| 公開安全性 | iconUrl は **公開安全フィールド** | 元々 web で公開されている favicon の URL、漏洩リスクなし |
| 後方互換 | v1 producer 完全許容 | additive 後方互換、producer 順次対応可能 |
| SSRF 予防 | iconUrl の URL は publicUrl 相当の internal 拒否 | producer が誤って内部アドレス送ってきた場合の防御 |
| SoT 一貫性 | iconUrl 書き込みは service-info adapter のみ | admin write からは禁止、producer 自己申告を唯一の SoT に |

**連携**:
- `_shared/providers`: createServiceInfoAdapter が iconUrl 抽出 + `updateServiceMeta` 呼び出し
- `_shared/db`: services テーブル schema + `updateServiceMeta` 新設 + `toServiceDescriptor` 拡張
- `_shared/auth` (public-status): `buildPublicStatus` で `svc.iconUrl` を DTO に投影
- `registry`: `serviceDescriptorSchema` は iconUrl を受け付けない (admin write 経路の SoT 衝突防止)
- 連動 PJ bousai-bag-checker: `ServiceInfoResponse` 型 v2 + `collectMetrics` 戻り値に iconUrl 含める

## 8. タグ別追加項目

cross-cutting (型 + 公開 DTO) のため UI/state/offline/i18n/realtime タグなし。

**対外契約変更 (CF-20260528-016 で flow:revise §Step 3.1 (F) 項目として補完運用)**:
- 連動改修対象 PJ リスト: **bousai-bag-checker** (現状唯一の producer、同 slug `favicon-projection` で連動 revise を本セッション後に dispatch)。
- 将来登録 producer も v2 対応が前提となるため concept §1.4 or perspectives O48 に「service-info contract v2 必須」を追記推奨 (本 SPEC で「未決事項 [論点-FP1]」に登録、確定後に concept 反映)。

## 9. 未決事項

### [論点-FP1] producer 登録要件への v2 contract 必須化
- **影響範囲**: concept §1.4 or perspectives O48 (service-info contract SoT)
- **詰めるべき問い**: service-hub に新規登録するマイクロサービスは v2 contract (iconUrl 含む) を必須とするか、optional のままにするか
- **候補案**:
  - (a) **v2 必須**: 登録時に iconUrl 申告必須、無い場合は登録拒否 (型安全 + identity 強化)
  - (b) **v2 推奨 / v1 許容**: 既存 v1 producer は維持、新規も optional (柔軟性、ただし shipyard 表示が崩れる service が出る)
- **推奨**: **(b) v2 推奨 / v1 許容**。理由 = 各 producer が favicon 準備 (SVG 作成 / 配置) のタイミングを自己判断できる柔軟性を残す。shipyard 側で fallback アイコンを実装する前提があれば見栄え崩れは局所化される。perspectives O48 に「v2 推奨、v1 受信時は iconUrl 未対応として fallback 動作」と追記。
- **判断期限**: 本 SPEC 確定時 (本セッション内 or 次セッション)
- **担当**: seiji

### [論点-FP2] iconUrl 上書きセマンティクス (空送信時の挙動)
- **影響範囲**: `updateServiceMeta` 実装 + 002_REVISE_PLAN.md §5
- **詰めるべき問い**: producer が iconUrl を送信しない (key 自体無し) 場合、既存 `services.icon_url` を「保持」するか「NULL クリア」するか
- **候補案**:
  - (a) **保持** (推奨): producer が iconUrl key 送らない or null → 既存値そのまま。一度設定すれば消えない
  - (b) **クリア**: 毎回上書き、producer が送らない → NULL に戻る。常に producer 申告が SoT
- **推奨**: **(a) 保持**。理由 = producer 側で一時的に iconUrl を実装漏れ / リファクタで落とした場合に公開 UI が崩れない。明示的にクリアしたい場合は admin DB 直接更新 (運用イベント) で対応可能。format check fail も「無視 = 保持」と統一。
- **判断期限**: 002_REVISE_PLAN.md 確定時
- **担当**: seiji

### [論点-FP3] 公開 API の Cache-Control (60s) で iconUrl 反映遅延
- **影響範囲**: `api/public/status.ts`
- **詰めるべき問い**: 既存 `Cache-Control: public, max-age=60` のままで、producer が iconUrl 変更してから shipyard に反映されるまで最大 (cron 24h + cache 60s) ≈ 24h+1m。許容範囲か
- **推奨**: **許容** (現状維持)。favicon は静的 identity なので頻繁に変わらない、24h reflection で十分。admin が即時反映したい場合は cron 手動 trigger + cache bust で対応可能 (既存機能)。
- **判断期限**: 本 SPEC 確定時
- **担当**: seiji

## 10. 更新履歴

| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (service-info contract v2 + public-status DTO 拡張 + DB icon_url カラム追加 + 連動 PJ bousai-bag-checker 明示) | /flow:revise |
