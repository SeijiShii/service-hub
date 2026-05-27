import type { MetricKey } from "../../types/index.js";

export interface FunnelRates {
  /** 決済画面到達数 (checkout_started_month)。未申告/0 は null (=データなし)。 */
  started: number | null;
  /** 全体離脱率 = 1 − completed/started。0..1 に clamp。算出不能は null。 */
  abandonmentRate: number | null;
  /** カード失敗率 = card_failed/started。「クレジット決済が理由の離脱」。算出不能は null。 */
  cardFailureRate: number | null;
}

type Metrics = Partial<Record<MetricKey, number>>;

/**
 * Stripe Checkout ファネルから離脱率を算出 (business-observability Phase B)。
 * started が未申告 or 0 のときはゼロ除算回避で全て null (データなし)。
 */
export function computeFunnel(metrics: Metrics): FunnelRates {
  const started = metrics.checkout_started_month ?? null;
  if (started == null || started === 0) {
    return { started: started, abandonmentRate: null, cardFailureRate: null };
  }
  const completed = metrics.checkout_completed_month ?? null;
  const cardFailed = metrics.checkout_card_failed_month ?? null;

  const abandonmentRate =
    completed == null ? null : Math.min(1, Math.max(0, 1 - completed / started));
  const cardFailureRate = cardFailed == null ? null : cardFailed / started;

  return { started, abandonmentRate, cardFailureRate };
}
