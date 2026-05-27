import type { MetricKey } from "../../types/index.js";
import type { ProviderPricing } from "./pricing.js";
import { projectAhead } from "../../lib/projection.js";

export type UpgradeRec = "keep" | "upgrade" | "consolidate" | "sunset";

export interface MetricUsage {
  metricKey: MetricKey;
  aggregate: number;
  freeLimit: number;
  pct: number;
}

export interface AccountSim {
  provider: string;
  account: string;
  serviceCount: number;
  metrics: MetricUsage[];
  /** 無料枠消費率の最大 (全メトリクス中)。 */
  maxUsagePct: number;
  /** trend 外挿で無料枠上限に到達するまでの日数。未到達/データ不足は null。 */
  daysToCeiling: number | null;
  /** free→paid 格上げの月額コスト。 */
  upgradeCostUsd: number;
  /** このアカウントに相乗りする全サービスの合算収益。 */
  aggregateRevenueUsd: number;
  recommendation: UpgradeRec;
}

export interface AccountInput {
  provider: string;
  account: string;
  /** このアカウントに相乗りするサービス数。 */
  serviceCount: number;
  /** メトリクス別のアカウント合算使用量。 */
  usage: Partial<Record<MetricKey, number>>;
  /** メトリクス別の月次系列 (上限到達予測用、昇順)。 */
  series?: Partial<Record<MetricKey, number[]>>;
  /** アカウント合算収益 (月)。 */
  aggregateRevenueUsd: number;
}

const HORIZON_MONTHS = [1, 2, 3, 6, 12];

/**
 * provider アカウント単位の無料枠消費を評価し、格上げ要否を提案する (business-observability Phase D)。
 * 無料枠はアカウント単位で全サービスが共有する前提 ([論点-BO2])。
 */
export function simulateAccount(
  input: AccountInput,
  pricing: ProviderPricing,
  opts: { warnPct?: number } = {},
): AccountSim {
  const warnPct = opts.warnPct ?? 0.8;

  const metrics: MetricUsage[] = [];
  for (const [k, freeLimit] of Object.entries(pricing.freeLimits)) {
    if (freeLimit == null || freeLimit <= 0) continue;
    const aggregate = input.usage[k as MetricKey] ?? 0;
    metrics.push({ metricKey: k as MetricKey, aggregate, freeLimit, pct: aggregate / freeLimit });
  }
  const maxUsagePct = metrics.reduce((m, x) => Math.max(m, x.pct), 0);

  // 上限到達予測: 最も逼迫したメトリクスの系列を外挿し、最初に上限を超える月を探す。
  let daysToCeiling: number | null = null;
  const tightest = metrics.slice().sort((a, b) => b.pct - a.pct)[0];
  if (tightest) {
    if (tightest.pct >= 1) {
      daysToCeiling = 0; // 既に超過
    } else {
      const series = input.series?.[tightest.metricKey];
      if (series && series.length >= 2) {
        const proj = projectAhead(series, HORIZON_MONTHS);
        for (let i = 0; i < proj.length; i++) {
          const v = proj[i];
          if (v != null && v >= tightest.freeLimit) {
            daysToCeiling = HORIZON_MONTHS[i]! * 30;
            break;
          }
        }
      }
    }
  }

  const approaching = maxUsagePct >= warnPct || daysToCeiling != null;

  let recommendation: UpgradeRec;
  if (!approaching) {
    recommendation = "keep";
  } else if (input.aggregateRevenueUsd >= pricing.paidPriceMonthUsd) {
    recommendation = "upgrade"; // 合算収益が格上げコストを上回る
  } else if (input.serviceCount > 1) {
    recommendation = "consolidate"; // 収益不足だが複数 → 統合で無料枠に収める
  } else {
    recommendation = "sunset"; // 単一・収益不足 → 畳む (/flow:sunset)
  }

  return {
    provider: input.provider,
    account: input.account,
    serviceCount: input.serviceCount,
    metrics,
    maxUsagePct,
    daysToCeiling,
    upgradeCostUsd: pricing.paidPriceMonthUsd,
    aggregateRevenueUsd: input.aggregateRevenueUsd,
    recommendation,
  };
}
