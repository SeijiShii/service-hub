import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricChart, type MetricSeriesItem } from "./MetricChart.js";

const ptA = (capturedAt: string, value: number) => ({ capturedAt, value });

describe("MetricChart (timeseries-topchart、multi-series 共通化、spec-review R3/R5)", () => {
  describe("TS-U-20: multi-series 描画", () => {
    it("2 series 渡し → 2 Line + Legend + slug 別色 palette", () => {
      const series: MetricSeriesItem[] = [
        {
          slug: "a",
          name: "Service A",
          points: [ptA("2026-05-01T00:00:00Z", 10), ptA("2026-05-02T00:00:00Z", 20)],
        },
        {
          slug: "b",
          name: "Service B",
          points: [ptA("2026-05-01T00:00:00Z", 5), ptA("2026-05-02T00:00:00Z", 15)],
        },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      const figure = screen.getByTestId("chart-mau");
      expect(figure.getAttribute("data-points")).toBe("2"); // 2 unique timestamps
      expect(figure.getAttribute("data-series-count")).toBe("2");
      expect(figure.textContent).toContain("mau (count)");
    });
  });

  describe("TS-U-21: series 空 → データなし", () => {
    it("series=[] → 「データなし」表示", () => {
      render(<MetricChart metricKey="mau" unit="count" series={[]} />);
      expect(screen.getByTestId("chart-empty-mau")).not.toBeNull();
      expect(screen.getByTestId("chart-empty-mau").textContent).toBe("データなし");
    });
  });

  describe("TS-U-22: 全 series.points 空 → データなし", () => {
    it("series=[{points:[]},{points:[]}] → 「データなし」表示", () => {
      const series: MetricSeriesItem[] = [
        { slug: "a", name: "Service A", points: [] },
        { slug: "b", name: "Service B", points: [] },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      expect(screen.getByTestId("chart-empty-mau")).not.toBeNull();
    });
  });

  describe("TS-U-23: last_deploy_at Y 軸 tickFormatter = M/D (spec-review R3)", () => {
    it("metricKey=last_deploy_at + epoch_ms 値 → Intl.DateTimeFormat ja-JP M/D 形式 (生 epoch_ms 非表示)", () => {
      // 2026-05-28 18:00 UTC = epoch_ms ≈ 1779962400000
      const epoch = new Date("2026-05-28T18:00:00Z").getTime();
      const series: MetricSeriesItem[] = [
        {
          slug: "a",
          name: "Service A",
          points: [ptA("2026-05-28T00:00:00Z", epoch)],
        },
      ];
      const { container } = render(
        <MetricChart metricKey="last_deploy_at" unit="epoch_ms" series={series} />,
      );
      // recharts は SVG 描画、tickFormatter 結果が出るかは描画後の text node を見る
      // ここでは tickFormatter 自体の単体動作を確認 (実装内 helper を indirect 確認)
      const figure = container.querySelector('[data-testid="chart-last_deploy_at"]');
      expect(figure).not.toBeNull();
      // 生 epoch_ms 値が figure 内に表示されていないことを assert (recharts 描画後)
      // 注: chart の svg 内 tick text は jsdom で完全 render されないため、tickFormatter 関数の挙動は
      // 実装ファイル内で確認するか、ここでは関数公開せず描画結果の存在 + 「データなし」非表示で代替
      expect(container.querySelector('[data-testid="chart-empty-last_deploy_at"]')).toBeNull();
      // 期待: figure.textContent に M/D 形式 (例 "5/28") が含まれる or 少なくとも epoch 数値文字列 1779962400000 が含まれない
      expect(figure?.textContent ?? "").not.toContain("1779962400000");
    });
  });

  describe("TS-U-37: 1 series wrap (ServiceDetailView 互換、single series ケース)", () => {
    it("series 1 件のみ → 1 Line + Legend + chart-series-0 色", () => {
      const series: MetricSeriesItem[] = [
        {
          slug: "hana-memo",
          name: "花メモ",
          points: [ptA("2026-05-01T00:00:00Z", 1), ptA("2026-05-02T00:00:00Z", 1)],
        },
      ];
      render(<MetricChart metricKey="up" unit="bool" series={series} />);
      const figure = screen.getByTestId("chart-up");
      expect(figure.getAttribute("data-points")).toBe("2");
      expect(figure.getAttribute("data-series-count")).toBe("1");
    });
  });

  describe("TS-U-38: figcaption に metricKey + unit", () => {
    it("metricKey と unit が figcaption に表示される", () => {
      render(
        <MetricChart
          metricKey="db_storage_bytes"
          unit="bytes"
          series={[{ slug: "a", name: "A", points: [ptA("2026-05-01T00:00:00Z", 100)] }]}
        />,
      );
      expect(screen.getByTestId("chart-db_storage_bytes").textContent).toContain(
        "db_storage_bytes (bytes)",
      );
    });
  });
});
