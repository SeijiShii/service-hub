/**
 * dashboard 上部 chart の表示期間 (chart-ux 2026-06-08)。
 * client (セレクタ UI) / server (since 算出) / test で共有する純関数群。
 */
export type ChartPeriod = "all" | "30d" | "7d";

/** セレクタ表示順 + ラベル (全期間 / 30日 / 7日)。 */
export const CHART_PERIODS: ReadonlyArray<{
  value: ChartPeriod;
  label: string;
}> = [
  { value: "all", label: "全期間" },
  { value: "30d", label: "30日" },
  { value: "7d", label: "7日" },
] as const;

/** 既定期間 (現行挙動 = 直近 30 日 を維持)。 */
export const DEFAULT_PERIOD: ChartPeriod = "30d";

const DAY_MS = 86_400_000;

/** allowlist 正規化。不正値・未指定は既定 30d (例外を投げない)。 */
export function parsePeriod(raw: unknown): ChartPeriod {
  if (raw === "all" || raw === "30d" || raw === "7d") return raw;
  return DEFAULT_PERIOD;
}

/**
 * period → chart 取得の since ISO 文字列 (nowMs 起点)。
 * all は全期間 = epoch0 (recentSnapshots は sinceIso 必須のため new Date(0))。
 */
export function periodToSinceIso(period: ChartPeriod, nowMs: number): string {
  if (period === "all") return new Date(0).toISOString();
  const days = period === "7d" ? 7 : 30;
  return new Date(nowMs - days * DAY_MS).toISOString();
}
