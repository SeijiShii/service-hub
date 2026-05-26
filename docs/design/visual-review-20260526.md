# 視覚デザインレビュー (2026-05-26、/flow:design --review-only / Design gate P4.4b)

**対象**: dashboard / service-detail (実画面スクショ、Playwright headless)
**SoT**: docs/design/design-system.md (コックピット/dark)
**結果**: ✅ green (design-system §8 レビュー基準を全項目充足)

## dashboard (dashboard-happy.png)
- [✅] 一覧で down が一目 (kakei = 赤 ■ + 上部 AlertBanner「1 件のサービスがダウン」)
- [✅] 状態色 + **形状記号でも区別** (●up緑 / ▲warn橙 / ■down赤) = 色覚配慮
- [✅] 数値 mono・右揃え (142 / 38 / —)
- [✅] dark 地 (#0b0e14) にテキスト/状態色のコントラスト十分
- [✅] アクセント 1 色、状態色が意味を保持
- [✅] chrome 控えめ、一覧性良好

## service-detail (detail-happy.png)
- [✅] accent(青)の時系列折れ線、mono 軸ラベル
- [✅] ● 状態 + slug(mono) ヘッダ + URL リンク(accent)
- [✅] アラート履歴セクション

## コピー (O38)
- 内部ツール (対象=seiji) のため技術用語(MAU/status/errors)許容。一般向け公開なし → /flow:wording スキップ。

## 逸脱
- なし (TDD 修正不要)。

## 備考
- 視覚 L2(computed-style)/L3(AI Vision) は内部ツールのため L1 baseline + 本マルチモーダル目視で充足と判断。
