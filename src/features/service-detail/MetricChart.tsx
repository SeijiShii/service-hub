import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import type { MetricSeries } from "./detail.js";

const ACCENT = "var(--accent, #4f9cf9)";

/** メトリクス時系列の折れ線 (design-system: accent 色, mono 軸)。テスト容易化のため固定寸法。 */
export function MetricChart({ series, width = 480, height = 160 }: { series: MetricSeries; width?: number; height?: number }) {
  return (
    <figure data-testid={`chart-${series.metricKey}`} data-points={series.points.length}>
      <figcaption style={{ fontFamily: "ui-monospace, monospace" }}>
        {series.metricKey} ({series.unit})
      </figcaption>
      {series.points.length === 0 ? (
        <p data-testid={`chart-empty-${series.metricKey}`}>データなし</p>
      ) : (
        <LineChart width={width} height={height} data={series.points}>
          <XAxis dataKey="capturedAt" tick={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }} />
          <YAxis tick={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={ACCENT} dot={false} isAnimationActive={false} />
        </LineChart>
      )}
    </figure>
  );
}
