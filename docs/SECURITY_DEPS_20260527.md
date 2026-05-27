# 依存ライブラリ脆弱性スキャン結果

**スキャン日**: 2026-05-27 (+09:00)
**対象**: package-lock.json (Node.js)
**スキャナ**: `npm audit --json`
**dispatch 元**: /flow:auto §3.0c 鮮度ゲート (lockfile 変更 2026-05-26 18:06 + 新公開 endpoint `/api/public/status`)

## 1. サマリ
- 総検出: **17 件** (Critical 0 / High 6 / Moderate 11 / Low 0)
- **対応必須 (Critical/High)**: 6 件 — ただし**全て dev/build tooling の推移的依存** (本番ランタイム非搭載、後述 §2.1)
- §8 登録: 1 件 ([SEC-003]、status=open、推奨=accepted-risk、ユーザー確認待ち)

> **総合評価 (in-context severity = Low)**: 検出 17 件すべてが **build/dev/test ツールチェーンの推移的依存** (`@vercel/node` CLI ツール群 / esbuild / vite / vitest / drizzle-kit)。**本番デプロイされる serverless functions のリクエスト処理経路には乗らない**。本番ランタイム依存 (`@clerk/backend` / `@neondatabase/serverless` / `drizzle-orm` / `react` / `zod` / `@iarna/toml`) は**脆弱性ゼロ**。さらに本 PJ は**内部・単一ユーザー (seiji)・Clerk gate** であり、ビルド工程に外部の信頼できない入力が到達しない。実効的な攻撃面はほぼ無い。

## 2. Critical / High 詳細

### 2.1 High (6 件 — すべて `@vercel/node` devDependency の推移的依存)

`@vercel/node@5.8.4` (devDependency、`VercelRequest`/`VercelResponse` 型 + ローカル `vercel dev` ツール用) が以下を bundle:

| パッケージ | CVE 概要 | 影響 |
|---|---|---|
| `minimatch` (10.0.0-10.2.2) | ReDoS (repeated wildcards / GLOBSTAR / nested extglobs) | build glob 解決 |
| `path-to-regexp` (4.0.0-6.2.2) | backtracking 正規表現 (ReDoS) | ルーティングパターン解析 (build) |
| `undici` (<=6.23.0) | Insufficiently Random Values / 解凍チェーン / DoS / Request Smuggling / WebSocket メモリ | @vercel/node 内部 HTTP (build/dev) |
| `@vercel/build-utils` | (上記の集約) | build |
| `@vercel/python-analysis` | minimatch + smol-toml 経由 | build (Python 解析、本 PJ 未使用) |
| `@vercel/node` | 上記すべての親 | devDependency |

- **npm 提示の "fix"**: `@vercel/node@4.0.0` (`isSemVerMajor: true`) = **forward fix ではなく downgrade**。インストール済 5.8.4 は既に最新系で、これらの推移的依存は **upstream Vercel ツール側**に残存 → **クリーンな前方修正は存在しない**。
- **本番ランタイム非搭載**: deploy された functions は Vercel マネージドランタイムで動作。`@vercel/node` は型定義 + ローカルツール用 devDependency であり、これらの脆弱コードは**本番リクエスト処理に乗らない**。
- **攻撃面**: 内部単一ユーザーツールの build 工程に外部入力なし → ReDoS/DoS の実効トリガ経路なし。

→ **推奨: accepted-risk** (devDep build-tooling / 本番ランタイム非搭載 / 前方修正なし / 内部単一ユーザー)。リスク受容は**ユーザーの明示判断が必須** (secure 契約: High に accepted-risk を auto では選ばない)。§8 [SEC-003] status=open で登録し、確認待ち。

### 2.2 Critical
なし。

## 3. Moderate (11 件、記載のみ — 全て dev/build/test tooling)

| パッケージ | CVE 概要 | 区分 |
|---|---|---|
| esbuild (<=0.24.2) | dev server が任意サイトからのリクエストを許可 | dev server (本番非該当) |
| vite (<=6.4.1) | Optimized Deps `.map` の Path Traversal | dev server |
| vite-node / @vitest/mocker / vitest | vite 経由 | test |
| ajv (7.0.0-8.17.1) | `$data` option の ReDoS | build (@vercel/static-config 経由) |
| @vercel/static-config | ajv 経由 | build |
| smol-toml (<1.6.1) | TOML コメント行大量で DoS | build (@vercel/python-analysis 経由、未使用) |
| @esbuild-kit/core-utils / esm-loader | esbuild 経由 | drizzle-kit (build/migration) |
| drizzle-kit | @esbuild-kit/esm-loader 経由 | migration ツール (devDependency) |

→ いずれも dev/build/test 限定。本番ランタイム非該当。Medium 以下のため §8 登録なし (本レポートに記載)。

## 4. 自動更新メカニズムの推奨
- [ ] `@vercel/node` の upstream で推移的依存が修正され次第アップグレード (現時点で forward fix なし、定期再スキャンで追跡)
- [ ] Dependabot (`.github/dependabot.yml`) — ただし本 PJ は dev tooling のみ該当のため優先度低
- [ ] CI `npm audit --omit=dev --audit-level=high` — **本番依存のみ**に絞れば現状 0 件 (健全性の継続確認に有効)

## 5. アップグレード手順 (将来 forward fix 出現時)
```
npm i -D @vercel/node@latest   # 推移的依存が解消されたバージョンが出たら
npm audit --omit=dev           # 本番依存のみ再確認 (現状 0 件)
```
