# クレーム調査レポート

**claim id**: C20260601-001
**実施日**: 2026-06-01
**対象機能**: collection
**緊急度推定**: medium（運用の自己可観測性の欠落。データ収集は partial で継続できるが、原因究明・対処ができない）

## 1. クレーム原文

```
{
    "id": "4222ff55-be98-4d01-9056-84730548bfb2",
    "startedAt": "2026-05-31T23:43:34.664Z",
    "finishedAt": "2026-05-31T23:43:36.389Z",
    "status": "partial",
    "servicesCount": 2,
    "errors": [
        {
            "serviceSlug": "bousai-bag-checker",
            "provider": "service-info",
            "message": "http_404"
        }
    ]
}

エラーが返っているが詳細が分からない
```

## 2. 分解結果

### 2.1 期待挙動 (Expected)
collection が partial（一部 adapter 失敗）で返ったとき、運用者が errors[] を見て
**「どの URL に対する失敗か」「なぜ失敗したか」「次に何をすべきか」**を判断できる。
特に **認証失敗（共有シークレット不一致）は 401/403 として現れ、adapter の既存マッピングで
`"auth"` と表示される**べき。そうすれば「秘密を直せ」と一目で分かる。

> **報告者の追加見解（2026-06-01）**: 「おそらくシークレットが正しくないので弾かれた。
> 404 ではなく 401 になるべき事案」。= 真因は HUB_SERVICE_INFO_SECRET の不一致で、
> 症状として返るべきは 401（認証失敗）。それが 404 になっているため誤解を招く。

### 2.2 現実挙動 (Actual)
errors[] の各要素は `{ serviceSlug, provider, message }` の 3 フィールドのみで、
`message` は `"http_404"` というコード文字列。
- 失敗対象の **URL（service-info エンドポイント）が含まれない**
- 404 の**原因分類・対処ヒントがない**（エンドポイント未デプロイ / URL 設定ミス / パス変更 等の区別がつかない）
- run JSON 以外に詳細を引ける**ログ／診断面が露出していない**（運用者から見える形がこの JSON のみ）

### 2.3 発生条件
- 操作手順: `/api/cron/collect`（または手動実行）で全 active サービスを pull
- 対象: `bousai-bag-checker` の `service-info` adapter
- 機構: adapter が当該サービスの service-info エンドポイントへ fetch → HTTP 404 →
  `getJson` が `throw new Error("http_404")`（`src/providers/adapters.ts:37`）→
  `wrapWithMeta` が `{ metrics: [], error: "http_404" }` に変換（`adapters.ts:81-87`）→
  runner が `errors[]` に `{ serviceSlug, provider, message: "http_404" }` で集約（`src/features/collection/runner.ts:44-49`）
- status: errors.length(1) < attempted（複数 adapter）のため `partial`（`runner.ts:96-98`）

### 2.4 影響範囲
- 該当: bousai-bag-checker の service-info 由来メトリクス（自己申告 MAU / iconUrl 等）が欠落
- 業務影響: 当該サービスの採算/利用状況の可観測性が欠ける。さらに**原因究明コスト**が運用者に転嫁される
- データ影響: 当該 run でその service の service-info メトリクスは未取得（他 adapter・他サービスは継続）

### 2.5 報告経路
- 経路: 開発者（運用者）自身の実行結果観察（社内 / セルフ運用）
- 温度感: 冷静（機能改善要望寄り）

### 2.6 報告者文脈
運用者は「収集が一部失敗した」事実は掴めたが、**原因を特定して直す**（エンドポイントを直す / 設定を直す）
ところまで到達できなかった。エラーから対処に繋げたい。

## 3. 過去類似クレーム

| claim id | 日付 | 判定 | 関連度 |
|---|---|---|---|
| （該当なし。本 PJ 初の claim） | — | — | — |

## 4. 根本原因の再評価（報告者見解を反映）

報告者の見解「秘密不一致で弾かれた／本来 401」を踏まえた機構の再整理:

1. service-hub の service-info adapter は `Authorization: Bearer ${HUB_SERVICE_INFO_SECRET}`
   を付けて producer のエンドポイントへ GET する（`src/providers/adapters.ts:207-212`）。
2. adapter は status を分類する: **401/403 → `"auth"`**, 429 → `"rate_limited"`,
   それ以外 → `http_<status>`（`adapters.ts:35-37`）。
   → producer が **401 を返せば** error は `"auth"` となり「秘密を直せ」と即分かる。
3. ところが producer（bousai-bag-checker）は**秘密不正に対し 404 を返している**疑い。
   その結果 service-hub は「認証失敗」と「エンドポイント不在」を区別できず、汎用 `http_404`
   に落ちて診断不能になる。
4. service-hub が定義する **service-info 標準契約（[論点-003] / concept §6.1）は認証=共有
   シークレットを規定するが、認証失敗時に producer が返すべき status code（401/403）を
   規定していない** = 仕様検討漏れ。契約 SoT は `_shared/providers`（service-info adapter
   SPEC §1.3）+ `_shared/types`。

> **真因（運用者の即時アクション）**: HUB_SERVICE_INFO_SECRET が service-hub 側と
> bousai-bag-checker 側で一致しているか確認。不一致なら揃える。
> **本 claim のスコープ（service-hub 側）**: 契約に「認証失敗 → 401/403、404 は真の不在に
> 限定」を明文化し、producer 実装に波及させる（クロスサービス契約）。bousai-bag-checker の
> エンドポイントが 404→401 を返すよう直すのは別 repo の fix（下流波及）。
