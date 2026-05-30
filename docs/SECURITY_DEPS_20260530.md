# 依存ライブラリ脆弱性スキャン結果

**スキャン日**: 2026-05-30
**対象**: package-lock.json (npm)
**スキャナ**: npm audit
**トリガー**: /flow:auto §3.0c release-pre 必須監査 2 段目 (last-deploy-col 9th deploy 前)

## 1. サマリ
- **依存変更**: なし — `package-lock.json` / `package.json` は前回 secure (D20260528_033、commit 106855d) 以降**未変更**。last-deploy-col は display-only 改修で新規 dep 追加なし。
- **新規 SEC**: **0 件** (lockfile 不変 = posture 不変)
- prod-only (`npm audit --omit=dev --audit-level=high`): **High/Critical 0 件** (moderate 2 = esbuild/vite build-tooling、新規でない)
- full (incl dev): 17 件 (11 moderate / 6 high) = **全て SEC-003 既知** (@vercel/node devDependency チェーン、accepted-risk 確定 close 済 D20260528-126)
- §8 登録: 0 件 (新規なし)

## 2. Critical / High 詳細
新規なし。既存 SEC-003 (6 high devDep、ReDoS/undici) は §8 [論点-005] で **accepted-risk 確定 close** 済 (2026-05-28、D-126)。本回も維持 (release Phase 1 で確認窓既消化、再提示しない)。

## 3. Medium 以下
- prod: esbuild/vite 2 moderate (build-tooling、本番リクエスト処理経路に非搭載)。新規でなく lockfile 不変。

## 4. 判定
**release-pre secure 2 段目 = PASS (新規 SEC 0 件)**。SEC-003 accepted-risk maintain (5 回連続、悪循環回避のため再提示せず維持)。release-pre 必須監査 2 段クリア完了 (audit D-006 + secure 本回) → **P4.7 Release gate (9th deploy) 評価可能**。
