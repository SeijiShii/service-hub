# 修正計画: DB スキーマ push 機構の整備と適用

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`
> **最終更新**: 2026-05-26

## 1. 修正対象ファイル
| ファイル | 修正内容 |
|---|---|
| `drizzle.config.ts`（新規） | schema=`./src/db/schema.ts`、dialect=postgresql、`dbCredentials.url=process.env.DATABASE_URL` |
| `package.json` | `"db:push": "drizzle-kit push"`、`"db:generate": "drizzle-kit generate"` を追加 |
| （実行）`npm run db:push` | `.env.local` の `DATABASE_URL` を注入して Neon に 3 テーブル適用 |

drizzle.config.ts:
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

## 2. 修正範囲の限定方針
スキーマ定義（`schema.ts`）は SoT として無変更。適用機構（config + script）のみ追加し、Neon へ push。

## 3. 副作用なき確認方法
- push 後 `select tablename from pg_tables where schemaname='public'` で 3 テーブル存在を確認。
- 既存 pglite 統合テスト（`queries.test.ts`）は無変更で green 維持。
- `typecheck` / `build` に影響なし（config はビルド対象外）。

## 4. リリース戦略
通常（release Phase で push を実施→デプロイ）。push は冪等（既存テーブルは差分のみ）。

## 5. ロールバック方針
- config/script は git revert。
- テーブルは内部ツール初期化前提のため `DROP TABLE` or `drizzle-kit drop` で除去可（本番データ無し）。

## 6. DoD
- [ ] `npm run db:push` で Neon に 3 テーブルが作成される
- [ ] push 後の smoke クエリで 3 テーブル確認
- [ ] 既存 pglite テスト green 維持 / typecheck・build green
