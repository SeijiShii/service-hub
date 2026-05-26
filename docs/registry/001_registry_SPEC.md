# registry 機能仕様書

> **役割**: Git 管理の宣言ファイル `services.toml`（レジストリ SoT、D20260526-004）をパース・検証・ロードし、`ServiceDescriptor[]` を提供する。
> **タグ**: feature（ただし標準 UI なし＝一覧描画は dashboard）
> **最終更新**: 2026-05-26
> **入力**: `../concept.md`（§1.1 UC4 / §5.1 / §1.2）, `../_shared/types/`, `./README.md`
> **依存**: `_shared/types`

---

## 1. 詳細 UC（提供インターフェース中心）
### UC4（concept §1.1）: サービスの追加・ロード
- **トリガー**: ビルド/起動時、または collection/dashboard がサービス一覧を要求。
- **処理**: リポジトリ直下の `services.toml` を Read → パース → スキーマ検証 → `ServiceDescriptor[]`。
- **出力**: 検証済み `ServiceDescriptor[]`（status=active のみ / 全件、引数で切替）。

## 2. 入出力
### 2.1 提供関数
```ts
loadServices(opts?: { onlyActive?: boolean }): ServiceDescriptor[];   // 検証込み
validateServicesToml(raw: string): { services: ServiceDescriptor[]; errors: ValidationError[] };
```
### 2.2 副作用
- ファイル読み取り（`services.toml`）。書き込みなし（SoT は Git、UI から編集しない）。

## 3. データモデル
新規 entity なし。`ServiceDescriptor`（types）をパース結果として返す。`services.toml` フォーマット例:
```toml
[[service]]
slug = "hana-memo"
name = "hana-memo"
url = "https://hana-memo.example.com"
status = "active"
[service.providers.vercel]
projectId = "prj_xxx"
[service.providers.neon]
projectId = "neon_xxx"
[service.providers.clerk]
appId = "app_xxx"
secretEnv = "HANAMEMO_CLERK_SECRET"   # env キー名（値は書かない）
[service.serviceInfo]
endpoint = "https://hana-memo.example.com/api/hub/service-info"
secretEnv = "HANAMEMO_HUB_SECRET"
```

## 4. バリデーション + エラーケース（registry の核、[論点-004] 連動）
| 対象 | ルール | エラー時 |
|---|---|---|
| slug | 必須・一意・ファイル名安全（`^[a-z0-9-]+$`） | 検証エラー、当該 service スキップ + ログ |
| url | 必須・http(s) スキーム・**内部アドレス禁止**（SSRF 予防、[論点-004]） | 検証エラー |
| status | active/paused/retired のいずれか | 既定 active + 警告 |
| providers | 各 provider の必須 ID（vercel.projectId 等） | 不足は当該 provider のみ無効化 |
| secretEnv | env キー名（値が直書きされていないか＝`pk_`/`sk_` 等のパターン検出） | **秘密直書き検出時はエラー**（O25） |
- スキーマ検証は **Zod 等**（PLAN で確定）。検証失敗の service は除外し、`errors[]` に集約（全体は止めない）。

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| 検証厳格 | 不正 service は除外、秘密直書きはエラー | O25 / [論点-004] |
| 起動時ロード | 低頻度（ビルド/起動時 + collection 開始時） | concept §3 |

### 5.2 連携（被依存）
| 連携先 | 内容 |
|---|---|
| collection | status=active の ServiceDescriptor[] を取得して pull |
| dashboard / service-detail | サービス一覧・メタ表示 |

## 6. タグ別追加項目
（UI なしのため画面系タグなし。analytics なし。）

## 7. スコープ外
- サービスの追加 UI（SoT は Git、宣言ファイル編集 = 手動 + commit、D20260526-004）。
- 各 provider の pull（providers）。

## 8. 未決事項
現時点で論点なし (2026-05-26)。services.toml パーサ（TOML ライブラリ）+ 検証（Zod）は PLAN で確定。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復6） | /flow:feature |
