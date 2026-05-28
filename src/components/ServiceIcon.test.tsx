import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServiceIcon } from "./ServiceIcon.js";

describe("ServiceIcon (favicon-projection、CF-20260528-020)", () => {
  it("FP-UI-01: iconUrl 有 → <img> で表示", () => {
    render(
      <ServiceIcon iconUrl="https://x.example/favicon.svg" slug="hana-memo" />,
    );
    const img = screen.getByTestId("service-icon-hana-memo").querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://x.example/favicon.svg");
  });

  it("FP-UI-02: iconUrl 無 → slug 頭文字 placeholder にフォールバック", () => {
    render(<ServiceIcon iconUrl={undefined} slug="hana-memo" />);
    const wrap = screen.getByTestId("service-icon-hana-memo");
    expect(wrap.querySelector("img")).toBeNull();
    expect(wrap.textContent).toBe("H"); // slug 頭文字 (大文字)
  });

  it("FP-UI-03: <img> onError 発火時 → placeholder にフォールバック", () => {
    render(
      <ServiceIcon iconUrl="https://broken.example/icon.png" slug="hana-memo" />,
    );
    const img = screen.getByTestId("service-icon-hana-memo").querySelector("img");
    expect(img).not.toBeNull();
    // onError をシミュレート
    fireEvent.error(img!);
    // 再 render 後、img は消えて placeholder に
    const wrap = screen.getByTestId("service-icon-hana-memo");
    expect(wrap.querySelector("img")).toBeNull();
    expect(wrap.textContent).toBe("H");
  });

  it("FP-UI-04: slug 1 文字目を大文字化 (lowercase slug → uppercase initial)", () => {
    render(<ServiceIcon iconUrl={undefined} slug="bousai-bag-checker" />);
    expect(screen.getByTestId("service-icon-bousai-bag-checker").textContent).toBe("B");
  });

  it("FP-UI-05: size 指定で width/height 反映", () => {
    render(<ServiceIcon iconUrl="https://x.example/icon.svg" slug="x" size={32} />);
    const img = screen.getByTestId("service-icon-x").querySelector("img");
    expect(img?.getAttribute("width")).toBe("32");
    expect(img?.getAttribute("height")).toBe("32");
  });
});
