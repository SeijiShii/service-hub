import { CostSimView, type CostSimResponse } from "./CostSimView.js";
import { useFetch } from "../../lib/useFetch.js";

export function CostSimPage() {
  const { loading, data, error } = useFetch<CostSimResponse>("/api/cost-sim/summary");
  if (loading) return <main><p>読み込み中…</p></main>;
  if (error || !data) return <main><p role="alert">読み込みに失敗しました（{error}）</p></main>;
  return <CostSimView data={data} />;
}
