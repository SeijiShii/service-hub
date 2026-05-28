import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MetricKey } from "../types/index.js";
import { chartSeriesColor } from "./tokens.js";

/**
 * Multi-series 対応 metric chart (timeseries-topchart、spec-review R5)。
 * service-detail と dashboard 上部 chart で共通利用。
 * 1 series = ServiceDetail (single)、複数 series = Dashboard (全 service 重ね描き)。
 */
export interface MetricSeriesItem {
  slug: string;
  name: string;
  points: Array<{ capturedAt: string; value: number }>;
}

export interface MetricChartProps {
  metricKey: MetricKey;
  unit: string;
  series: MetricSeriesItem[];
  height?: number;
}

/**
 * last_deploy_at (epoch_ms) は M/D 表示、他は数値そのまま (spec-review R3)。
 * 日本語 PJ で直感的、Intl.DateTimeFormat 標準 API。
 */
function tickFormatterForMetric(
  metricKey: MetricKey,
): ((v: number) => string) | undefined {
  if (metricKey === "last_deploy_at") {
    const fmt = new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
    });
    return (v: number) => fmt.format(new Date(v));
  }
  return undefined; // recharts default
}

/**
 * 全 series が空 points なら「データなし」 (空 series 配列も同等)。
 * 1 series 以上に points あれば chart 描画。
 */
function hasAnyPoints(series: MetricSeriesItem[]): boolean {
  return series.some((s) => s.points.length > 0);
}

/**
 * 多 series を recharts 用に merged data に変換:
 * [{capturedAt, [slug1]: value, [slug2]: value, ...}, ...]
 */
function mergeSeries(
  series: MetricSeriesItem[],
): Array<Record<string, string | number>> {
  const byTime = new Map<string, Record<string, string | number>>();
  for (const s of series) {
    for (const p of s.points) {
      const row = byTime.get(p.capturedAt) ?? { capturedAt: p.capturedAt };
      row[s.slug] = p.value;
      byTime.set(p.capturedAt, row);
    }
  }
  return Array.from(byTime.values()).sort((a, b) =>
    String(a.capturedAt).localeCompare(String(b.capturedAt)),
  );
}

export function MetricChart({
  metricKey,
  unit,
  series,
  height = 160,
}: MetricChartProps) {
  const empty = !hasAnyPoints(series);
  const merged = empty ? [] : mergeSeries(series);
  const yTickFormatter = tickFormatterForMetric(metricKey);

  return (
    <figure
      data-testid={`chart-${metricKey}`}
      data-points={merged.length}
      data-series-count={series.length}
    >
      <figcaption style={{ fontFamily: "ui-monospace, monospace" }}>
        {metricKey} ({unit})
      </figcaption>
      {empty ? (
        <p data-testid={`chart-empty-${metricKey}`}>データなし</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={merged}>
            <XAxis
              dataKey="capturedAt"
              tick={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 10,
              }}
            />
            <YAxis
              tick={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 10,
              }}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface, #1a1f2a)",
                border: "1px solid var(--border, #2a2f3a)",
                borderRadius: 4,
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--text, #e5e7eb)" }}
              itemStyle={{ color: "var(--text, #e5e7eb)" }}
              labelFormatter={(v) => {
                if (v === undefined || v === null || v === "") return "";
                if (metricKey === "last_deploy_at") {
                  const d = new Date(Number(v));
                  return Number.isNaN(d.getTime())
                    ? String(v)
                    : new Intl.DateTimeFormat("ja-JP", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      }).format(d);
                }
                const d = new Date(String(v));
                return Number.isNaN(d.getTime())
                  ? String(v)
                  : new Intl.DateTimeFormat("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(d);
              }}
            />
            <Legend />
            {series.map((s, idx) => (
              <Line
                key={s.slug}
                type="monotone"
                dataKey={s.slug}
                name={s.name}
                stroke={chartSeriesColor(idx)}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}
