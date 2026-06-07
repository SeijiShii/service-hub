import { MetricChart, bucketEpoch } from "../../components/MetricChart.js";
import type { DashboardChart } from "./summary.js";
import {
  CHART_PERIODS,
  DEFAULT_PERIOD,
  type ChartPeriod,
} from "./chartPeriod.js";

/**
 * 全 chart の series points から共有 X domain [minEpochMs, maxEpochMs] を算出 (chart-ux 2026-06-08)。
 * 縦並びの複数 chart に同一 domain を渡して時間軸を揃える。
 * bucketEpoch (MetricChart の x 正規化と同一) で min/max を取るため、各 chart の描画点が必ず domain 内に収まる。
 * 点が 1 つも無ければ undefined (= MetricChart は従来 dataMin/dataMax fallback、空 chart は「データなし」)。
 */
export function sharedXDomain(
  charts: DashboardChart[],
): [number, number] | undefined {
  let min = Infinity;
  let max = -Infinity;
  for (const chart of charts) {
    for (const s of chart.series) {
      for (const p of s.points) {
        const x = bucketEpoch(p.capturedAt);
        if (x < min) min = x;
        if (x > max) max = x;
      }
    }
  }
  if (min === Infinity) return undefined;
  return [min, max];
}

/**
 * dashboard 上部 chart section (chart-ux 2026-06-08)。
 * 「ユーザー数 / 収益(¥)」の 2 chart を縦並び表示 (chart.label を見出しに)。
 * 全 chart は sharedXDomain で算出した共有 X 時間軸 (domain) で描画され横位置が揃う。
 * 期間セレクタ (全期間/30日/7日) を header に置き、選択で onPeriodChange を発火 (取得 since 切替は上位)。
 * 各 chart は MetricChart に委譲 (空 series で「データなし」)。
 */
export interface DashboardChartsProps {
  charts: DashboardChart[];
  /** 選択中の表示期間 (未指定なら既定 30d 表示)。 */
  period?: ChartPeriod;
  /** 期間変更ハンドラ。指定時のみセレクタを表示。 */
  onPeriodChange?: (period: ChartPeriod) => void;
}

export function DashboardCharts({
  charts,
  period = DEFAULT_PERIOD,
  onPeriodChange,
}: DashboardChartsProps) {
  const domain = sharedXDomain(charts);
  return (
    <section
      data-section="charts"
      data-testid="dashboard-charts"
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border, #2a2f3a)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          margin: "0 0 12px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-muted, #9aa3b2)",
          }}
        >
          収益・利用の推移
        </h2>
        {onPeriodChange && (
          <div
            data-testid="chart-period-selector"
            role="group"
            aria-label="表示期間"
            style={{ display: "flex", gap: 4 }}
          >
            {CHART_PERIODS.map((p) => {
              const active = p.value === period;
              return (
                <button
                  key={p.value}
                  type="button"
                  data-testid={`chart-period-${p.value}`}
                  aria-pressed={active}
                  onClick={() => onPeriodChange(p.value)}
                  style={{
                    background: active
                      ? "var(--surface, #1a1f2a)"
                      : "transparent",
                    color: active
                      ? "var(--text, #e6e9ef)"
                      : "var(--text-muted, #9aa3b2)",
                    border: "1px solid var(--border, #2a2f3a)",
                    borderRadius: 6,
                    padding: "2px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {charts.map((chart) => (
          <MetricChart
            key={chart.metricKey}
            metricKey={chart.metricKey}
            label={chart.label}
            unit={chart.unit}
            series={chart.series}
            domain={domain}
          />
        ))}
      </div>
    </section>
  );
}
