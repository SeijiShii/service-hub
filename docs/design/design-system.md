# service-hub デザインシステム (SoT)

**生成元**: /flow:design (NEW, /flow:auto P4.4 Design gate)
**最終更新**: 2026-05-26
**方向**: コックピット (dark 主体) — 監視コンソール。承認済 D20260526-015
**コンセプト根拠**: docs/concept.md（単一ユーザー内部の運用ダッシュボード / 稼働・利用・コスト・障害を一括把握 / pull で観測）

> 視覚スパイク + headless スクショ視覚レビュー（Step 4）は **scaffold 生成後（Phase 3）** に `/flow:design --review-only` で実施。本ファイルは SoT（原則 + トークン + コンポーネント + ボイス）。

---

## 1. デザイン原則（コンセプト → 視覚）

1. **状態がひと目で分かる（status-first）** — 本プロダクトの価値は「どれが生きていて、どれが落ちているか」を一括把握すること。**セマンティック状態色（up/warn/down/unknown）が視覚の主役**。色だけに依存せずアイコン形状でも区別（色覚配慮）。
2. **数値は読み取りやすく（data-dense, scannable）** — MAU/コスト/エラー件数/使用率を等幅・右揃え・tabular-nums で整列。一覧で縦に比較できる。
3. **chrome は控えめ、内容が主役** — 装飾・余白を絞り、限られた画面に多くのサービスを一覧。dark 背景で状態色とデータを浮かせる。
4. **落ち着いた監視卓** — 単一ユーザー（seiji）が日常的に開く道具。派手さでなく、長時間見ても疲れない低コントラスト地 + 要所だけ高コントラスト。
5. **無料枠の余白を可視化** — コスト/使用率は「無料枠に対する消費率」を併せて見せ、超過が近いものを warn 色で前景化（concept §1.1 UC3 / alerts）。

## 2. カラートークン（dark 主体、意味名）

| トークン | 値(目安) | 用途 |
|---|---|---|
| `--bg` | `#0b0e14` | 最背面 |
| `--surface` | `#131720` | カード/行の面 |
| `--surface-raised` | `#1b2230` | ホバー/選択/モーダル |
| `--border` | `#232b3a` | 境界線・区切り |
| `--text` | `#e6e9ef` | 主テキスト |
| `--text-muted` | `#9aa4b2` | ラベル・副次 |
| `--text-faint` | `#5b6676` | 補助・プレースホルダ |
| `--accent` | `#4f9cf9` | リンク・選択・フォーカス（**唯一のブランドアクセント**） |
| `--status-up` | `#34d399` | 稼働 / 健全 / 無料枠余裕 |
| `--status-warn` | `#fbbf24` | 警告 / 無料枠 80%+ / 遅延 |
| `--status-down` | `#f87171` | ダウン / エラー / 無料枠超過 |
| `--status-unknown` | `#6b7280` | 不明 / paused / 未収集 |

- 状態色は**アイコン形状でも冗長化**（●up / ▲warn / ■down / ○unknown 等）して色覚に依存しない。
- アクセントは 1 色のみ。状態色をブランド装飾に転用しない（意味を薄めない）。
- ライトテーマは MVP では持たない（dark 単一、将来 `prefers-color-scheme` 対応の余地）。

## 3. タイポグラフィ

| 役割 | フォント | 備考 |
|---|---|---|
| UI（ラベル/本文） | system-ui / Inter 系 sans | 中立 |
| **数値・slug・ID・トークン数** | ui-monospace / JetBrains Mono 系 | **tabular-nums で右揃え整列** |

- スケール（compact, base 14px）: `xs 12 / sm 13 / base 14 / lg 16 / xl 20 / 2xl 28`
- 行間: データ行 1.3、本文 1.5。
- メトリクスは必ず mono + 右揃え（縦比較のため）。

## 4. 形・影・余白

- 余白スケール（4px 基準・密）: `4 / 8 / 12 / 16 / 24 / 32`
- 角丸: `sm 4 / md 6 / lg 8`（控えめ）
- 影: dark のため影は最小限。面の区別は `--border` + `--surface-raised` の明度差で行う。
- 密度: 一覧行は高さ 36–40px 目安（多サービスを一画面に）。

## 5. コンポーネント（基本形）

- **StatusDot / StatusPill**: 状態色 + 形状アイコン + ラベル（up/down/warn/unknown）。一覧の先頭列。
- **ServiceRow**: `[StatusDot] サービス名(slug=mono) | MAU(mono) | コスト(mono) | エラー(mono) | 最終更新`。クリックで詳細へ。
- **MetricCell**: mono + 右揃え + tabular-nums。欠損は `—`（text-faint）。
- **QuotaBar**: 無料枠に対する消費率バー。0–79% up色 / 80–99% warn / 100%+ down。`142 / ∞` のような上限表記も。
- **Sparkline**: 時系列の小型折れ線（service-detail / 一覧の傾向）。`--accent` + 状態色。
- **CostBadge**: 月内コスト概算（mono）。$0.00 は muted。
- **Card / Panel**: `--surface` + `--border`。見出し + 内容。
- **Nav / Header**: プロダクト名 + 全体サマリ（"3 up · 1 down"）+ seiji（Clerk ユーザー）。
- **EmptyState**: services.toml が空 / 収集前。簡素な line-art SVG（テーマ色追従）+ 次アクション。
- **AlertBanner**: 無料枠超過/ダウン検知の通知（warn/down 色、画面上部）。
- **(O41 入口リード)**: 本 PJ は**内部ツール・リンク流入想定なし**のため「これは何？」インフォボタンは**不要**（O41 スキップ。Clerk gate 越しに seiji のみが入る）。

## 6. ボイス & コピー

- **対象ユーザーは開発者（seiji）本人の内部ツール** → O38（技術用語 NG）は**緩和**。`MAU` `deploy` `quota` `error rate` `Neon` `Vercel` 等のプロバイダ名・技術語はそのまま使用してよい（むしろ正確で速い）。
- ただし**短く・明確に**。ラベルは名詞中心（"Errors (24h)" / "Free tier" / "Last collected"）。
- 状態は素直に: "up" / "down" / "no data"。誇張しない。
- 一般ユーザー向け公開がないため `/flow:wording` 対話校正は**スキップ可**。

## 7. アイコン & イラスト戦略

- **アイコン**: lucide（OSS、line アイコン）。状態・操作・プロバイダ表現に使用。絵文字は使わない。
- **イラスト**: 最小限。EmptyState 等に簡素な自作 line-art SVG（`currentColor` でテーマ色追従）。内部ツールのため装飾イラストは抑制。
- **プロバイダロゴ**: Vercel/Neon/Clerk/Cloudflare/Sentry は必要なら公式 simple-icons（単色）を muted で。

## 8. レビュー基準（Step 4 視覚レビュー時、scaffold 後に適用）

- [ ] 一覧で「どれが down か」が 1 秒で分かる（状態色 + 形状）。
- [ ] 数値が mono・右揃え・tabular で縦比較できる。
- [ ] 無料枠 80%+ のサービスが warn 色で前景化されている。
- [ ] dark 地に対しテキスト/状態色のコントラストが十分（WCAG AA 目安）。
- [ ] アクセントは 1 色に収まり、状態色が意味を保っている。
- [ ] chrome（装飾・余白）が内容を圧迫していない（多サービス一覧性）。
- [ ] 色のみに依存せず形状でも状態区別（色覚配慮）。
