import type { MetricKey } from "../../types/index.js";

/** 採算状態: 黒字 / 薄利 / 赤字 / データなし(null)。 */
export type ProfitState = "profit" | "thin" | "loss" | null;

export interface Profitability {
  /** 当月収益 (revenue_month_usd)。未申告は null。 */
  revenue: number | null;
  /** 当月コスト (ai_cost_month_usd、未申告は 0 扱い)。revenue なしのときは null。 */
  cost: number | null;
  /** 収益 − コスト。算出不能は null。 */
  profit: number | null;
  state: ProfitState;
}

export interface ProfitThresholds {
  /** 薄利と判定する利益率(profit/revenue)の上限。既定 0.15。 */
  thinMarginMax?: number;
}

type Metrics = Partial<Record<MetricKey, number>>;

/**
 * service-info 自己申告メトリクスから採算を算出 (business-observability Phase A)。
 * revenue 未申告 = データなし(null)。cost 未申告は 0 扱い (revenue があれば算出)。
 */
export function computeProfitability(metrics: Metrics, thresholds: ProfitThresholds = {}): Profitability {
  const revenue = metrics.revenue_month_usd ?? null;
  if (revenue == null) return { revenue: null, cost: null, profit: null, state: null };

  const cost = metrics.ai_cost_month_usd ?? 0;
  const profit = revenue - cost;
  const thinMarginMax = thresholds.thinMarginMax ?? 0.15;

  let state: ProfitState;
  if (profit < 0) state = "loss";
  else if (revenue > 0 && profit / revenue <= thinMarginMax) state = "thin";
  else state = "profit";

  return { revenue, cost, profit, state };
}
