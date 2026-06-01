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
  /** 見出し用ラベル (biz-charts)。未指定なら metricKey で fallback (service-detail 後方互換、spec-review R2)。 */
  label?: string;
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

/** capturedAt を分バケットの epoch ms に正規化 (fix C20260601-002)。 */
const MINUTE_MS = 60_000;
function bucketEpoch(capturedAt: string): number {
  const t = new Date(capturedAt).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor(t / MINUTE_MS) * MINUTE_MS;
}

/**
 * 多 series を recharts 用に merged data に変換 (fix C20260601-002):
 * x を分バケットの epoch ms (number) に正規化してから集約する。
 * これにより同一 run でミリ秒だけずれた service 間の点が同一 x 行へ整列し、
 * x 軸を連続時間軸 (type=number) として実間隔比例配置できる。
 * [{ x: epochMs, [slug1]: value, [slug2]: value, ... }, ...]
 */
function mergeSeries(
  series: MetricSeriesItem[],
): Array<Record<string, number>> {
  const byBucket = new Map<number, Record<string, number>>();
  for (const s of series) {
    for (const p of s.points) {
      const x = bucketEpoch(p.capturedAt);
      const row = byBucket.get(x) ?? { x };
      row[s.slug] = p.value;
      byBucket.set(x, row);
    }
  }
  return Array.from(byBucket.values()).sort((a, b) => a.x - b.x);
}

/** x 軸 (capturedAt epoch) を分単位 M/D HH:mm に整形 (ミリ秒・秒を除去)。 */
const xAxisFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
function formatXAxis(v: number): string {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : xAxisFormatter.format(d);
}

export function MetricChart({
  metricKey,
  label,
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
        {label ?? metricKey} ({unit})
      </figcaption>
      {empty ? (
        <p data-testid={`chart-empty-${metricKey}`}>データなし</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={merged}>
            <XAxis
              dataKey="x"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatXAxis}
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
              // label = x 軸値 (capturedAt epoch、全 metric 共通) → M/D HH:mm 整形 (fix C20260601-002)。
              labelFormatter={(v) => {
                if (v === undefined || v === null || v === "") return "";
                const d = new Date(Number(v));
                return Number.isNaN(d.getTime())
                  ? String(v)
                  : xAxisFormatter.format(d);
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
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}
