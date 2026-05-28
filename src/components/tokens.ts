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
 * service 別 chart line palette (timeseries-topchart、CSS var + fallback、dark テーマ向け色相環 8 色)。
 * dashboard 上部 chart で複数 service 重ね描き時の line stroke。8 service 超は循環使用。
 * 色相環: 青 → シアン → 緑 → 黄緑 → 黄 → 橙 → 赤 → ピンク (saturation 60% / lightness 65%)。
 */
export const CHART_SERIES_COLORS: readonly string[] = [
  "var(--chart-series-0, #5b9cf5)", // 青
  "var(--chart-series-1, #34d3a0)", // シアン
  "var(--chart-series-2, #34d399)", // 緑
  "var(--chart-series-3, #a3e635)", // 黄緑
  "var(--chart-series-4, #fbbf24)", // 黄
  "var(--chart-series-5, #fb923c)", // 橙
  "var(--chart-series-6, #f87171)", // 赤
  "var(--chart-series-7, #ec4899)", // ピンク
] as const;

/** index → palette 色 (8 超は循環)。 */
export function chartSeriesColor(index: number): string {
  return CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]!;
}
