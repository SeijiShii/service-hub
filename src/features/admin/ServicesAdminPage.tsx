import { useCallback, useEffect, useRef, useState } from "react";
import { ServicesAdminView } from "./ServicesAdminView.js";
import type { SaveState } from "./saveState.js";
import type { ServiceDescriptor } from "../../types/index.js";

/** admin write の配線 (force-pull は D20260528-022 で dashboard へ relocation 済)。
 *  - GET 一覧 + POST/PATCH/DELETE → /api/admin/services
 *  - 保存進捗は SaveState で View に伝播 (D20260528-029〜032)
 *  - 成功時 500ms 後に idle に戻す (saveState success の自然 fadeout)
 */
export function ServicesAdminPage() {
  const [services, setServices] = useState<ServiceDescriptor[]>([]);
  const [error, setError] = useState<string>();
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const fadeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/services", { credentials: "include" });
      if (!r.ok) throw new Error(`http_${r.status}`);
      setServices((await r.json()) as ServiceDescriptor[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => {
      if (fadeoutTimer.current) clearTimeout(fadeoutTimer.current);
    };
  }, [reload]);

  /** POST/PATCH 成功で true、失敗で false。View は false 時に form 値を保持する。 */
  const onSave = useCallback(
    async (d: ServiceDescriptor): Promise<boolean> => {
      if (fadeoutTimer.current) clearTimeout(fadeoutTimer.current);
      setSaveState({ kind: "saving" });
      const exists = services.some((s) => s.slug === d.slug);
      const url = exists
        ? `/api/admin/services?slug=${encodeURIComponent(d.slug)}`
        : "/api/admin/services";
      try {
        const r = await fetch(url, {
          method: exists ? "PATCH" : "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(d),
        });
        if (!r.ok) {
          setSaveState({ kind: "error", message: `http_${r.status}` });
          return false;
        }
        setSaveState({ kind: "success" });
        // 鮮度更新: 一覧を再取得 (View は既に form clear 済み)
        await reload();
        // success 表示は 2.5 秒で自然 fadeout (idle に戻す)
        fadeoutTimer.current = setTimeout(
          () => setSaveState({ kind: "idle" }),
          2500,
        );
        return true;
      } catch (e) {
        setSaveState({
          kind: "error",
          message: e instanceof Error ? e.message : "network_error",
        });
        return false;
      }
    },
    [services, reload],
  );

  const onRetire = useCallback(
    async (slug: string) => {
      await fetch(`/api/admin/services?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      await reload();
    },
    [reload],
  );

  return (
    <>
      {error && <p role="alert">エラー: {error}</p>}
      <ServicesAdminView
        services={services}
        onSave={onSave}
        onRetire={onRetire}
        saveState={saveState}
      />
    </>
  );
}
