# service-hub

flow で連発するマイクロサービス群の稼働・利用・コスト・障害を、各 PaaS の API を pull して一画面で横断把握する**開発者専用の内部運用ダッシュボード**。

## 概要

週1ペースで増えるマイクロサービスの運用状況は各 PaaS の管理画面に散在する。service-hub は各 PaaS API を定期 pull して集約・時系列保存し、全サービスを横断する 1 画面に可視化する。**サービス側を無改修のまま**後付けで観測できる（pull 方式）。スコープは閲覧のみ（observability）、単一ユーザー（seiji）内部ツール。

## 主要機能

- **全サービス横断サマリ**: 稼働 / 利用数 / コスト概算 / エラー件数の一覧
- **個別サービスの時系列**: 利用数・DB 使用量・帯域・エラーの推移グラフ
- **無料枠超過アラート**: 閾値到達を通知
- **死活確認**: 各サービス URL の定期 ping
- **Git 管理レジストリ**: `services.toml` への 1 エントリ追記で管理対象に追加

## 技術スタック

- フロント: Vite + React + TypeScript / shadcn/ui + Tailwind / Recharts / TanStack Query
- サーバー: Vercel Functions + Vercel Cron
- データ層: Neon (Postgres) + Drizzle
- 認証: Clerk（単一ユーザー）
- ホスティング: Vercel Hobby
- 監視: Sentry

## Getting Started (Local Development)

### 前提条件
- Node.js（nvm / asdf 等で管理）
- `.env.local` の準備（`.env.example` をコピーして実値を埋める。詳細は [docs/PREREQUISITES.md](./docs/PREREQUISITES.md)）

### 起動
```bash
./scripts/dev.sh      # 統合 launcher（未実装なら下記個別）
vercel dev            # または個別に
```

### よく使うコマンド
| 用途 | コマンド |
|---|---|
| dev サーバー起動 | `./scripts/dev.sh` / `vercel dev` |
| DB マイグレーション | `npm run db:migrate` |
| pull 手動実行 | `curl localhost:3000/api/cron/collect` |
| 型チェック | `npm run typecheck` |
| ユニットテスト | `npm run test` |

## 開発状態
企画（concept 初版）。次は `/flow:estimate` → `/flow:feature`。

## 設計ドキュメント
- [全体概念・要件・設計](./docs/concept.md) — プロジェクト中央書類
- [開発シナリオ](./docs/SCENARIO.md) — next-step 判断用
- [機能フォルダ INDEX](./docs/INDEX.md)
- [AI 用エントリポイント](./docs/DOC_MAP.md)
- [実装前準備チェックリスト](./docs/PREREQUISITES.md)

## ライセンス
All Rights Reserved（内部ツール、非公開）。
