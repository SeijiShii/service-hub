# E2E テストレポート: dashboard chart-colors (series-palette)

- 状態: **E2E green**
- FW: Playwright (`@playwright/test` 1.60)  実行コマンド: `npx playwright test`  対象 URL: ローカル dev (vite preview `http://localhost:4173`、route-mock)
- last_updated: 2026-06-08T13:40:00+09:00

## journey 別結果

| journey (004 由来) | spec | 結果 | artifacts |
|---|---|---|---|
| CC-E2E-01: 少数 service の色分離（暖寒交互 palette） | e2e/dashboard.spec.ts | ✅ pass | trace off（green） |
| CC-E2E-R1: 2 chart 描画 + 「データなし」（chart-ux 集約維持） | e2e/dashboard.spec.ts (CX-E2E-01 / UC1-S2) | ✅ pass | — |
| CC-E2E-R2: 期間セレクタ + 共有 X 軸 | e2e/dashboard.spec.ts (CX-E2E-01) | ✅ pass | — |
| CC-E2E-R3: 凡例に service 名（色は補助） | e2e/dashboard.spec.ts (FX-E2E-01) | ✅ pass | — |
| （横断リグレッション）service-detail 単一 series chart | e2e/service-detail.spec.ts | ✅ pass | idx0 青据置で見た目不変 |

**全 spec: 17/17 pass（dashboard 9 + service-detail 3 + admin/cost-sim 5）、flaky 0。**

### CC-E2E-01 の要点
2 series（hana-memo / naze-bako）の mau chart で recharts の `path.recharts-line-curve` を 2 本取得し:
- 2 本の `stroke` が相異なる（near-dup でない）
- idx0 stroke が青 `#5b9cf5`、idx1 stroke が橙 `#fb923c`（暖色）を含む

→ 少数 service でも「青と緑だけ」でなく暖寒で明確に区別されることを実ブラウザ描画で確認。

## flaky / quarantine
なし。

## 検出した実装バグ (fix seed)
なし（純視覚変更、全 green）。

## metrics
metrics: { wall_clock_min: ~12, active_minutes: ~10, e2e_specs: 17, pass: 17, fail: 0, flaky: 0, new_specs: 1 }
