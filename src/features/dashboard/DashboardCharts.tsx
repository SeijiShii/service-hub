import { MetricChart } from "../../components/MetricChart.js";
import type { DashboardChart } from "./summary.js";

/**
 * dashboard 上部 chart section (biz-charts、2026-05-30)。
 * ビジネス 4 metric を上から「ユーザー数 / 課金額 / コスト / 採算」で縦並び表示 (chart.label を見出しに)。
 * up(死活)は一覧 status 列、last_deploy_at は一覧「最終デプロイ」列、db_storage_bytes は chart 対象外。
 * 採算は revenue−cost の派生系列 (buildCharts)。各 chart は MetricChart に委譲 (空 series で「データなし」)。
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
            label={chart.label}
            unit={chart.unit}
            series={chart.series}
          />
        ))}
      </div>
    </section>
  );
}
