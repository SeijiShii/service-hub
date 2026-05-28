import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServicesAdminView } from "./ServicesAdminView.js";
import type { ServiceDescriptor, CollectionRun } from "../../types/index.js";

const svc = (over: Partial<ServiceDescriptor> = {}): ServiceDescriptor => ({
  slug: "hana-memo",
  name: "hana-memo",
  url: "https://hana-memo.givers.work",
  status: "active",
  providers: { vercel: { projectId: "prj_x" } },
  ...over,
});

describe("ServicesAdminView (admin form Phase 4)", () => {
  it("UX-N3: フォームに 3 セクション (基本情報/Providers/Service-info) が存在 (styling Phase 2)", () => {
    render(
      <ServicesAdminView services={[]} onSave={() => {}} onRetire={() => {}} />,
    );
    expect(document.querySelector('[data-section="basic"]')).toBeTruthy();
    expect(document.querySelector('[data-section="providers"]')).toBeTruthy();
    expect(
      document.querySelector('[data-section="service-info"]'),
    ).toBeTruthy();
  });

  it("AF-1: 既存サービスを行で一覧表示", () => {
    render(
      <ServicesAdminView
        services={[svc()]}
        onSave={() => {}}
        onRetire={() => {}}
      />,
    );
    const row = document.querySelector('tr[data-slug="hana-memo"]');
    expect(row).toBeTruthy();
    expect(row?.getAttribute("data-status")).toBe("active");
  });

  it("AF-2: フォーム入力 → 登録で onSave に descriptor", () => {
    const onSave = vi.fn();
    render(
      <ServicesAdminView services={[]} onSave={onSave} onRetire={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "demo-svc" },
    });
    fireEvent.change(screen.getByLabelText("名前"), {
      target: { value: "Demo" },
    });
    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "https://demo.example.com" },
    });
    fireEvent.change(screen.getByLabelText("Vercel projectId"), {
      target: { value: "prj_1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登録" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const arg = onSave.mock.calls[0][0] as ServiceDescriptor;
    expect(arg.slug).toBe("demo-svc");
    expect(arg.url).toBe("https://demo.example.com");
    expect(arg.providers.vercel?.projectId).toBe("prj_1");
  });

  it("AF-3: 退役ボタン → onRetire(slug)", () => {
    const onRetire = vi.fn();
    render(
      <ServicesAdminView
        services={[svc()]}
        onSave={() => {}}
        onRetire={onRetire}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "退役" }));
    expect(onRetire).toHaveBeenCalledWith("hana-memo");
  });

  it("AF-4: 編集 → slug は readonly、ボタンが更新に", () => {
    render(
      <ServicesAdminView
        services={[svc()]}
        onSave={() => {}}
        onRetire={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(screen.getByLabelText("slug")).toHaveProperty("readOnly", true);
    expect(screen.getByRole("button", { name: "更新" })).toBeTruthy();
  });

  it("FP-N3: 「今すぐ pull」ボタン click → onForcePull が 1 回呼ばれる", () => {
    const onForcePull = vi.fn();
    render(
      <ServicesAdminView
        services={[]}
        onSave={() => {}}
        onRetire={() => {}}
        onForcePull={onForcePull}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "今すぐ pull" }));
    expect(onForcePull).toHaveBeenCalledTimes(1);
  });

  it("FP-N4: forcePullState.lastResult → サマリ表示 (services/errors 件数)", () => {
    const result: CollectionRun = {
      id: "r1",
      startedAt: "2026-05-28T03:00:00.000Z",
      finishedAt: "2026-05-28T03:00:30.000Z",
      status: "ok",
      servicesCount: 3,
      errors: [{ serviceSlug: "x", provider: "ping", message: "timeout" }],
    };
    render(
      <ServicesAdminView
        services={[]}
        onSave={() => {}}
        onRetire={() => {}}
        onForcePull={() => {}}
        forcePullState={{ running: false, lastResult: result }}
      />,
    );
    const summary = screen.getByTestId("force-pull-result");
    expect(summary.textContent).toContain("3");
    expect(summary.textContent).toContain("1");
  });

  it("FP-E4: running=true → ボタン disabled + 「実行中…」表記 + click しても呼ばれない", () => {
    const onForcePull = vi.fn();
    render(
      <ServicesAdminView
        services={[]}
        onSave={() => {}}
        onRetire={() => {}}
        onForcePull={onForcePull}
        forcePullState={{ running: true }}
      />,
    );
    const btn = screen.getByRole("button", {
      name: "実行中…",
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onForcePull).not.toHaveBeenCalled();
  });
});
