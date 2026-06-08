/** design-system (コックピット/dark) の状態色トークン。 */
export const STATUS_COLOR = {
  up: "var(--status-up, #34d399)",
  warn: "var(--status-warn, #fbbf24)",
  down: "var(--status-down, #f87171)",
  unknown: "var(--status-unknown, #6b7280)",
} as const;

export type StatusKind = keyof typeof STATUS_COLOR;

/** 状態を色覚非依存の形状記号でも区別 (design-system §1 原則1)。 */
export const STATUS_SHAPE: Record<StatusKind, string> = {
  up: "●",
  warn: "▲",
  down: "■",
  unknown: "○",
};

/**
 * service 別 chart line palette (CSS var + fallback、dark テーマ向け 8 色)。
 * dashboard 上部 chart で複数 service 重ね描き時の line stroke。8 service 超は循環使用。
 *
 * 並び順 (revise chart-colors 2026-06-08): **暖色/寒色を交互配置**。
 * 旧版は色相環の自然順 (青→シアン→緑→黄緑…) で先頭3色が青〜緑のクール域に固まり、
 * service が 2〜3 個だと「青と緑だけ」に見えていた。さらに旧 idx1 シアン #34d3a0 は
 * idx2 緑 #34d399 とほぼ同色 (near-dup) で見分けづらかった。
 * → 暖寒交互順に並べ替え、near-dup を明瞭なシアン #22d3ee へ差替、末尾に紫を追加し、
 *   少数 service でも先頭から色相が明確に分かれるようにした。idx0 の青は据置 (既存互換)。
 */
export const CHART_SERIES_COLORS: readonly string[] = [
  "var(--chart-series-0, #5b9cf5)", // 青 (寒)
  "var(--chart-series-1, #fb923c)", // 橙 (暖)
  "var(--chart-series-2, #34d399)", // 緑 (寒)
  "var(--chart-series-3, #ec4899)", // ピンク (暖)
  "var(--chart-series-4, #fbbf24)", // 黄 (暖)
  "var(--chart-series-5, #22d3ee)", // シアン (寒、旧 #34d3a0 の near-dup を解消)
  "var(--chart-series-6, #f87171)", // 赤 (暖)
  "var(--chart-series-7, #a78bfa)", // 紫 (寒、追加)
] as const;

/** index → palette 色 (8 超は循環)。 */
export function chartSeriesColor(index: number): string {
  return CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]!;
}
