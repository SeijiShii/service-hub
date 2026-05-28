import { MetricChart } from "../../components/MetricChart.js";
import type { DashboardChart } from "./summary.js";

/**
 * dashboard 上部 chart section (timeseries-topchart、spec-review R4)。
 * 主要 4 metric (up / mau / db_storage_bytes / last_deploy_at) を縦並びで表示。
 * 各 chart は MetricChart に委譲 (全 service 重ね描き、空 series で「データなし」 fallback)。
 *
 * section header = 「直近 30 日の推移」 + border-bottom (DashboardView force-pull section と同パターン)。
 */
export interface DashboardChartsProps {
  charts: DashboardChart[];
}

export function DashboardCharts({ charts }: DashboardChartsProps) {
  return (
    <section
      data-section="charts"
      data-testid="dashboard-charts"
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border, #2a2f3a)",
      }}
    >
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-muted, #9aa3b2)",
        }}
      >
        直近 30 日の推移
      </h2>
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
            unit={chart.unit}
            series={chart.series}
          />
        ))}
      </div>
    </section>
  );
}
