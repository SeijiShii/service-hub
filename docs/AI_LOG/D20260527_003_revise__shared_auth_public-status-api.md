# AI_LOG セッション D20260527_003 — /flow:revise (_shared/auth, public-status-api)

**実行日時**: 2026-05-27 (進行中) (+09:00)
**コマンド**: /flow:revise
**対象**: _shared/auth (アンカー: 公開カーブアウト) + 横断 (types / dashboard or 新 public モジュール / api / registry / db)
**issue/slug**: 001 / public-status-api
**実行者**: Claude (Opus 4.7)
**状態**: 完了 (REVISE_SPEC + PLAN + UNIT_TEST + E2E_TEST 4文書)
**依存**: _shared/auth feature SPEC (全ルート Clerk gate / pull データ・トークン非公開), dashboard feature, business-observability revise (機微データ追加 → 漏洩防止の動機)

## Decisions
```yaml
- id: D20260527-018
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Step 1-2 (コンテキスト + アンカー + Read スコープ)
  question: 公開ステータス API のアンカーと設計の核
  chosen: アンカー=_shared/auth (唯一の公開カーブアウト)。核=安全サブセット投影 (内部指標を構造的に出さない)
  chosen_type: auto-recommended
  depends_on: []
  context: |
    別サービス(公開ショーケース、別フォルダ)が消費する公開 read-only API。
    auth SPEC「全ルート保護(例外なく)/pull データ・トークン非公開」への意図的な1例外。
    business-observability で収益/コスト/離脱率が入ったため漏洩防止が最優先。
    純ロジック buildPublicStatus(services, latest) が安全サブセットのみ組み立て、テストで
    内部フィールド非含有を assert。dashboard の full VM とは別物。

- id: D20260527-019
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Step 3 (REVISE_SPEC 設計判断、auto-pick)
  question: 公開 API の契約・CORS・キャッシュ・認可カーブアウト
  chosen: |
    - レスポンス: PublicServiceStatus[] = { slug, name, url, status:'up'|'down'|'unknown', lastCheckedAt? }
      のみ。内部 (revenue/cost/profit/funnel/mau/raw_json/thresholds/providers/token) は構造的に含めない。
    - 認可: requireSeiji を通さない公開ルート。isPublicCronPath と同様「ユーザーゲート対象外パス」に
      /api/public/* を追加 (isPublicPath)。これが唯一の公開例外、auth SPEC に明記。
    - CORS: Access-Control-Allow-Origin=`*` (データは公開安全前提、最簡)。OPTIONS preflight 対応。
      [論点-PS1] showcase ドメイン確定後に env で origin 制限する選択肢を残す。
    - キャッシュ: Cache-Control: public, max-age=60 (HUB を叩きすぎない)。
    - データ源: registry active + DB 最新 up スナップショット。up メトリクス=1→up/0→down/無→unknown。
      lastCheckedAt=最新 captured_at。
  chosen_type: auto-recommended
  recommended: 上記 (CORS=* は公開安全データの機械的既定、§論点 PS1 で制限余地)
  depends_on: [D20260527-018]
  context: |
    後方互換: 完全 additive (新ルート1本、既存ルートの gate は不変)。スキーマ変更なし。
    リスク: 安全サブセット投影を誤って full VM にすると財務漏洩 → 純ロジック + テストで担保、
    DTO を明示型で固定 (dashboard VM を import して返さない)。
```

- id: D20260527-020
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Phase 2-4 完了 (PLAN + UNIT_TEST + E2E_TEST) + INDEX
  question: 公開ステータス API の設計文書一式
  chosen: 4文書生成完了。実装 Phase A(投影ロジック+内部キー非含有テスト)/B(公開ハンドラ+CORS)/C(文書)
  chosen_type: auto-recommended
  depends_on: [D20260527-019]
  context: |
    セキュリティ最重要テスト PS-S1/PS-H2 (内部指標キーが JSON に漏れない) を必須化。
    認可リグレッション PS-RE1 (他 API は 401 維持)。完全 additive・DB 変更なし。実装は /flow:tdd。
