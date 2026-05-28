# 改修: service-info contract に iconUrl を追加し public-status DTO に投影 (favicon-projection)

- **issue / slug**: favicon-projection
- **実施日**: 2026-05-28
- **対象機能**: ../README.md (_shared/types)
- **基準 SPEC**: ../001_types_SPEC.md
- **改修要望**: shipyard で公開サービス一覧を表示するにあたり、各サービスのアイコン (favicon) も並べたい。直接 `${url}/favicon.ico` は SPA rewrite で HTML が返るケース (例: hana-memo) があり脆い。各マイクロサービスは自分の favicon パスを把握しているので、**`service-info` contract で `iconUrl` を申告**してもらい、service-hub が DB に保存して `/api/public/status` で公開、shipyard はそのまま `<img src>` で使う。取得不可時は shipyard 側でデフォルトアイコンへフォールバック。
- **対外契約変更フラグ**: **yes** — `ServiceInfoResponse` (service-hub ←→ 各マイクロサービス間 contract) を v1 → v2 に bump
- **連動改修対象 PJ**: **bousai-bag-checker** (現状唯一の service-info producer) — 同 slug で `/flow:revise <root> favicon-projection-producer` 起動推奨。将来登録される全マイクロサービスも同様
- **状態**: 設計中

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書 (contract v1 → v2 差分 + public-status DTO 拡張)
- `002_REVISE_PLAN.md` — 変更計画書 (types + providers + db + auth/public-status + registry admin UI への波及)
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画 (公開 API レスポンスに iconUrl 含む / v1 producer の後方互換)
- `005_REVISE_MIGRATION.md` — マイグレーション (services テーブルに icon_url カラム追加)
- `101_REVISE_IMPL_REPORT.md` — 実装レポート (後続 `/flow:tdd`)

## 関連

- 過去の改修: ../ (revise_*/ なし、本件が _shared/types の初 revise)
- 関連 feature の改修: `../../auth/revise_001_20260527_public-status-api/` (public-status DTO の初版)
- 連動 PJ: `bousai-bag-checker/docs/_shared/service-info/revise_<同 slug>_20260528_*/` (producer 側で iconUrl を返す改修、本セッション後に手動 dispatch)
- 高度モデルレビュー: `/flow:spec-review` 推奨 (対外契約変更のため特に推奨度高)
