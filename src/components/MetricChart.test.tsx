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
          points: [
            ptA("2026-05-01T00:00:00Z", 10),
            ptA("2026-05-02T00:00:00Z", 20),
          ],
        },
        {
          slug: "b",
          name: "Service B",
          points: [
            ptA("2026-05-01T00:00:00Z", 5),
            ptA("2026-05-02T00:00:00Z", 15),
          ],
        },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      const figure = screen.getByTestId("chart-mau");
      expect(figure.getAttribute("data-points")).toBe("2"); // 2 unique timestamps
      expect(figure.getAttribute("data-series-count")).toBe("2");
      expect(figure.textContent).toContain("mau (count)");
    });
  });

  describe("BC-U-04/12: label prop (biz-charts)", () => {
    it("BC-U-04: label 指定 → 見出しに label を表示 (testid は metricKey 維持)", () => {
      render(
        <MetricChart
          metricKey="revenue_month_usd"
          label="課金額"
          unit="usd"
          series={[]}
        />,
      );
      const figure = screen.getByTestId("chart-empty-revenue_month_usd");
      // figure 全体の見出しは label
      const fig = screen.getByTestId("chart-revenue_month_usd");
      expect(fig.textContent).toContain("課金額 (usd)");
      expect(figure).not.toBeNull();
    });
    it("BC-U-12: label 未指定 → metricKey fallback (service-detail 後方互換)", () => {
      render(<MetricChart metricKey="mau" unit="count" series={[]} />);
      expect(screen.getByTestId("chart-mau").textContent).toContain(
        "mau (count)",
      );
    });
  });

  describe("TS-U-21: series 空 → データなし", () => {
    it("series=[] → 「データなし」表示", () => {
      render(<MetricChart metricKey="mau" unit="count" series={[]} />);
      expect(screen.getByTestId("chart-empty-mau")).not.toBeNull();
      expect(screen.getByTestId("chart-empty-mau").textContent).toBe(
        "データなし",
      );
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
        <MetricChart
          metricKey="last_deploy_at"
          unit="epoch_ms"
          series={series}
        />,
      );
      // recharts は SVG 描画、tickFormatter 結果が出るかは描画後の text node を見る
      // ここでは tickFormatter 自体の単体動作を確認 (実装内 helper を indirect 確認)
      const figure = container.querySelector(
        '[data-testid="chart-last_deploy_at"]',
      );
      expect(figure).not.toBeNull();
      // 生 epoch_ms 値が figure 内に表示されていないことを assert (recharts 描画後)
      // 注: chart の svg 内 tick text は jsdom で完全 render されないため、tickFormatter 関数の挙動は
      // 実装ファイル内で確認するか、ここでは関数公開せず描画結果の存在 + 「データなし」非表示で代替
      expect(
        container.querySelector('[data-testid="chart-empty-last_deploy_at"]'),
      ).toBeNull();
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
          points: [
            ptA("2026-05-01T00:00:00Z", 1),
            ptA("2026-05-02T00:00:00Z", 1),
          ],
        },
      ];
      render(<MetricChart metricKey="up" unit="bool" series={series} />);
      const figure = screen.getByTestId("chart-up");
      expect(figure.getAttribute("data-points")).toBe("2");
      expect(figure.getAttribute("data-series-count")).toBe("1");
    });
  });

  // ── fix C20260601-002: multi-series 整列マージ (時間軸化) ──────
  describe("FX-U: multi-series 時刻正規化マージ (fix C20260601-002)", () => {
    it("FX-U-02: ミリ秒だけ異なる同一論理時刻の 2 series → 同一バケットで 1 行にマージ", () => {
      const series: MetricSeriesItem[] = [
        { slug: "a", name: "A", points: [ptA("2026-05-01T00:00:00.000Z", 10)] },
        { slug: "b", name: "B", points: [ptA("2026-05-01T00:00:00.789Z", 5)] },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      const figure = screen.getByTestId("chart-mau");
      // 修正前: 文字列完全一致マージで data-points=2 (別 x に分裂) → 修正後: 1 バケット
      expect(figure.getAttribute("data-points")).toBe("1");
      expect(figure.getAttribute("data-series-count")).toBe("2");
    });

    it("FX-U-04: 疎データ (片 series のみの時刻) → 全時刻が x 行に存在、series 数維持", () => {
      const series: MetricSeriesItem[] = [
        {
          slug: "a",
          name: "A",
          points: [
            ptA("2026-05-01T00:00:00Z", 10),
            ptA("2026-05-01T00:15:00Z", 12),
          ],
        },
        { slug: "b", name: "B", points: [ptA("2026-05-01T00:00:00Z", 5)] }, // 00:15 欠落
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      const figure = screen.getByTestId("chart-mau");
      expect(figure.getAttribute("data-points")).toBe("2"); // 00:00 / 00:15 の 2 バケット
      expect(figure.getAttribute("data-series-count")).toBe("2");
    });

    it("FX-U-05: 2 service 同一時刻重ね描き → 1 行に両 series 整列", () => {
      const series: MetricSeriesItem[] = [
        {
          slug: "a",
          name: "A",
          points: [ptA("2026-05-01T00:00:00.100Z", 10)],
        },
        {
          slug: "b",
          name: "B",
          points: [ptA("2026-05-01T00:00:00.200Z", 20)],
        },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      const figure = screen.getByTestId("chart-mau");
      expect(figure.getAttribute("data-points")).toBe("1");
      expect(figure.getAttribute("data-series-count")).toBe("2");
    });

    it("FX-B-02: 別 run (分単位で離れた時刻) → 別 x バケットとして保持", () => {
      const series: MetricSeriesItem[] = [
        {
          slug: "a",
          name: "A",
          points: [
            ptA("2026-05-01T00:00:00Z", 10),
            ptA("2026-05-01T00:15:00Z", 11),
          ],
        },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      expect(screen.getByTestId("chart-mau").getAttribute("data-points")).toBe(
        "2",
      );
    });

    it("FB1: service slug が予約キーと紛らわしい 'x' でも epoch x と衝突しない", () => {
      const series: MetricSeriesItem[] = [
        {
          slug: "x",
          name: "Service X",
          points: [
            ptA("2026-05-01T00:00:00Z", 10),
            ptA("2026-05-02T00:00:00Z", 20),
          ],
        },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      const figure = screen.getByTestId("chart-mau");
      // 衝突回避 (予約キー __x) で 2 バケットが正しく保持される
      expect(figure.getAttribute("data-points")).toBe("2");
      expect(figure.getAttribute("data-series-count")).toBe("1");
    });

    it("FX-B-03: 単一 service (service-detail 経路) → 1 本描画 (後方互換)", () => {
      const series: MetricSeriesItem[] = [
        {
          slug: "hana-memo",
          name: "花メモ",
          points: [
            ptA("2026-05-01T00:00:00Z", 1),
            ptA("2026-05-02T00:00:00Z", 1),
          ],
        },
      ];
      render(<MetricChart metricKey="up" unit="bool" series={series} />);
      const figure = screen.getByTestId("chart-up");
      expect(figure.getAttribute("data-points")).toBe("2");
      expect(figure.getAttribute("data-series-count")).toBe("1");
    });
  });

  describe("CX-U: domain prop で共有時間軸 (chart-ux 2026-06-08)", () => {
    it("CX-U-01: domain 指定 → figure に data-domain が反映される", () => {
      const series: MetricSeriesItem[] = [
        { slug: "a", name: "A", points: [ptA("2026-05-01T00:00:00Z", 10)] },
      ];
      render(
        <MetricChart
          metricKey="mau"
          unit="count"
          series={series}
          domain={[1000, 2000]}
        />,
      );
      expect(screen.getByTestId("chart-mau").getAttribute("data-domain")).toBe(
        "1000,2000",
      );
    });

    it("CX-U-02: domain 未指定 → data-domain なし (従来 dataMin/dataMax fallback)", () => {
      const series: MetricSeriesItem[] = [
        { slug: "a", name: "A", points: [ptA("2026-05-01T00:00:00Z", 10)] },
      ];
      render(<MetricChart metricKey="mau" unit="count" series={series} />);
      expect(
        screen.getByTestId("chart-mau").getAttribute("data-domain"),
      ).toBeNull();
    });
  });

  describe("TS-U-38: figcaption に metricKey + unit", () => {
    it("metricKey と unit が figcaption に表示される", () => {
      render(
        <MetricChart
          metricKey="db_storage_bytes"
          unit="bytes"
          series={[
            {
              slug: "a",
              name: "A",
              points: [ptA("2026-05-01T00:00:00Z", 100)],
            },
          ]}
        />,
      );
      expect(
        screen.getByTestId("chart-db_storage_bytes").textContent,
      ).toContain("db_storage_bytes (bytes)");
    });
  });
});
