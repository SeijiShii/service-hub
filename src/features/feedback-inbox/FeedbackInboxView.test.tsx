import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedbackInboxView } from "./FeedbackInboxView.js";
import type { FeedbackInboxVM, FeedbackInboxItem } from "./inbox.js";

const item = (over: Partial<FeedbackInboxItem> = {}): FeedbackInboxItem => ({
  serviceSlug: "hana-memo",
  serviceName: "ハナメモ",
  externalId: "fb-1",
  kind: "feedback",
  body: "とても便利です",
  createdAt: "2026-06-10T00:00:00.000Z",
  pulledAt: "2026-06-18T00:00:00.000Z",
  ...over,
});

const vm = (over: Partial<FeedbackInboxVM> = {}): FeedbackInboxVM => ({
  items: [],
  services: [{ slug: "hana-memo", name: "ハナメモ" }],
  ...over,
});

const noop = () => {};
const baseProps = {
  service: "",
  kind: "" as const,
  period: "30d" as const,
  onServiceChange: noop,
  onKindChange: noop,
  onPeriodChange: noop,
};

describe("FeedbackInboxView", () => {
  it("FI-V1: 一覧描画 + サービス名 + kind バッジ", () => {
    render(
      <FeedbackInboxView
        {...baseProps}
        vm={vm({
          items: [
            item({ externalId: "a", kind: "bug", body: "落ちる" }),
            item({ externalId: "b", kind: "feedback", body: "良い" }),
          ],
        })}
      />,
    );
    expect(screen.getAllByTestId("feedback-item")).toHaveLength(2);
    expect(screen.getAllByText("ハナメモ").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("kind-badge").length).toBe(2);
  });

  it("FI-V2 (UC1-S4): 空状態メッセージ", () => {
    render(<FeedbackInboxView {...baseProps} vm={vm({ items: [] })} />);
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.queryByTestId("feedback-list")).toBeNull();
  });

  it("L2-3: フィルタ UI が一覧より上 (DOM 順)", () => {
    render(<FeedbackInboxView {...baseProps} vm={vm({ items: [item()] })} />);
    const filters = screen.getByTestId("filters");
    const list = screen.getByTestId("feedback-list");
    expect(
      filters.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("FI-V3: サービスフィルタ変更でコールバック", () => {
    const onServiceChange = vi.fn();
    render(
      <FeedbackInboxView
        {...baseProps}
        onServiceChange={onServiceChange}
        vm={vm({ items: [item()] })}
      />,
    );
    fireEvent.change(screen.getByLabelText("サービスで絞り込む"), {
      target: { value: "hana-memo" },
    });
    expect(onServiceChange).toHaveBeenCalledWith("hana-memo");
  });

  it("UC3-S1: トリアージでクレーム文をクリップボードへ", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(
      <FeedbackInboxView
        {...baseProps}
        vm={vm({ items: [item({ kind: "bug", body: "落ちる" })] })}
      />,
    );
    fireEvent.click(screen.getByText("クレーム文をコピー"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("落ちる"));
  });
});
