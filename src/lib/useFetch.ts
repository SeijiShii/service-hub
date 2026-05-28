import { useCallback, useEffect, useState } from "react";

export type FetchState<T> = {
  loading: boolean;
  data?: T;
  error?: string;
  /** 手動再取得 (force-pull 後の鮮度更新等)。state を上書き、cleanup 同梱で race-safe。 */
  refetch: () => Promise<void>;
};

/** 認証付き GET (Clerk セッション cookie は自動付与)。401/403/404 は error に。 */
export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<Omit<FetchState<T>, "refetch">>({
    loading: true,
  });

  const run = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: undefined }));
    try {
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok)
        throw new Error(r.status === 404 ? "not_found" : `http_${r.status}`);
      const data = (await r.json()) as T;
      setState({ loading: false, data });
    } catch (e) {
      setState({
        loading: false,
        error: e instanceof Error ? e.message : "error",
      });
    }
  }, [url]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await run();
      if (!alive) return; // unmount 後の state 更新を抑止 (run 内で既に setState 済だが、後続 race を防ぐ)
    })();
    return () => {
      alive = false;
    };
  }, [run]);

  return { ...state, refetch: run };
}
