import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ServicesAdminView } from "./ServicesAdminView.js";
import type { ServiceDescriptor } from "../../types/index.js";
import type { SaveState } from "./saveState.js";

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
      <ServicesAdminView
        services={[]}
        onSave={async () => true}
        onRetire={() => {}}
      />,
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
        onSave={async () => true}
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

  it("AF-3: 削除ボタン → onRetire(slug) (WORD-N1: 退役→削除)", () => {
    const onRetire = vi.fn();
    render(
      <ServicesAdminView
        services={[svc()]}
        onSave={async () => true}
        onRetire={onRetire}
      />,
    );
    // 「退役」が消えていることを明示的に確認
    expect(screen.queryByRole("button", { name: /退役/ })).toBeNull();
    // aria-label="<slug> を削除" を visible text "削除" 含むパターンで検索
    fireEvent.click(screen.getByRole("button", { name: /削除/ }));
    expect(onRetire).toHaveBeenCalledWith("hana-memo");
  });

  it("AF-4: 編集 → slug は readonly、ボタンが更新に", () => {
    render(
      <ServicesAdminView
        services={[svc()]}
        onSave={async () => true}
        onRetire={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(screen.getByLabelText("slug")).toHaveProperty("readOnly", true);
    expect(screen.getByRole("button", { name: "更新" })).toBeTruthy();
  });

  it("UX-N4: ヘッダに / へ戻る 'back-link' が表示 (nav-and-pull revise)", () => {
    render(
      <ServicesAdminView
        services={[]}
        onSave={async () => true}
        onRetire={() => {}}
      />,
    );
    const link = screen.getByTestId("back-link");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/");
    expect(link.textContent).toContain("ダッシュボード");
  });

  describe("async save UX (fix admin-form-bug-and-ux)", () => {
    it("SAVE-N1: saveState=saving → submit button disabled + 「保存中…」", () => {
      render(
        <ServicesAdminView
          services={[]}
          onSave={async () => true}
          onRetire={() => {}}
          saveState={{ kind: "saving" } satisfies SaveState}
        />,
      );
      const btn = screen.getByRole("button", {
        name: "保存中…",
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("SAVE-N2: saveState=success → save-status に「保存しました」", () => {
      render(
        <ServicesAdminView
          services={[]}
          onSave={async () => true}
          onRetire={() => {}}
          saveState={{ kind: "success" } satisfies SaveState}
        />,
      );
      const el = screen.getByTestId("save-status");
      expect(el.textContent).toContain("保存しました");
      expect(el.getAttribute("data-status")).toBe("success");
    });

    it("SAVE-E1: saveState=error → save-status に「保存に失敗」+ message", () => {
      render(
        <ServicesAdminView
          services={[]}
          onSave={async () => false}
          onRetire={() => {}}
          saveState={{ kind: "error", message: "http_500" } satisfies SaveState}
        />,
      );
      const el = screen.getByTestId("save-status");
      expect(el.textContent).toContain("保存に失敗");
      expect(el.textContent).toContain("http_500");
      expect(el.getAttribute("data-status")).toBe("error");
    });

    it("SAVE-N3: onSave が true を返す → form clear + editing=false", async () => {
      const onSave = vi.fn().mockResolvedValue(true);
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
      fireEvent.click(screen.getByRole("button", { name: "登録" }));
      // submit は async (await onSave → setF) → waitFor で flush
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
        expect((screen.getByLabelText("slug") as HTMLInputElement).value).toBe(
          "",
        );
      });
    });

    it("SAVE-N4: onSave が false を返す → form 保持 (値が残る)", async () => {
      const onSave = vi.fn().mockResolvedValue(false);
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
      fireEvent.click(screen.getByRole("button", { name: "登録" }));
      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      // form 値が保持 (失敗時は再試行できる)
      expect((screen.getByLabelText("slug") as HTMLInputElement).value).toBe(
        "demo-svc",
      );
      expect((screen.getByLabelText("名前") as HTMLInputElement).value).toBe(
        "Demo",
      );
    });
  });

  describe("UX help text (fix admin-form-bug-and-ux)", () => {
    it("FORM-N1: endpoint input に full URL placeholder + help text", () => {
      render(
        <ServicesAdminView
          services={[]}
          onSave={async () => true}
          onRetire={() => {}}
        />,
      );
      // label が input + help span を含むため accessible name は連結される → regex で先頭一致
      const input = screen.getByLabelText(/service-info endpoint/);
      expect(input.getAttribute("placeholder")).toContain(
        "/api/hub/service-info",
      );
      // help text にフル URL 指定の旨が書かれている
      const help = screen.getByTestId("endpoint-help");
      expect(help.textContent).toContain("フル URL");
    });

    it("FORM-N2: subdomain input に「現状未使用」placeholder + help", () => {
      render(
        <ServicesAdminView
          services={[]}
          onSave={async () => true}
          onRetire={() => {}}
        />,
      );
      const input = screen.getByLabelText(/サブドメイン/);
      expect(input.getAttribute("placeholder")).toContain("未使用");
      const help = screen.getByTestId("subdomain-help");
      expect(help.textContent).toContain("未参照");
    });
  });
});
