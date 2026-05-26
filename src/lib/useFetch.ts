import { useEffect, useState } from "react";

export type FetchState<T> = { loading: boolean; data?: T; error?: string };

/** 認証付き GET (Clerk セッション cookie は自動付与)。401/403/404 は error に。 */
export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ loading: true });
  useEffect(() => {
    let alive = true;
    fetch(url, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "not_found" : `http_${r.status}`);
        return (await r.json()) as T;
      })
      .then((data) => alive && setState({ loading: false, data }))
      .catch((e: unknown) => alive && setState({ loading: false, error: e instanceof Error ? e.message : "error" }));
    return () => { alive = false; };
  }, [url]);
  return state;
}
