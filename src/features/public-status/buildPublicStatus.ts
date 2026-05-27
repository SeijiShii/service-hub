import type { ServiceDescriptor, SnapshotRow } from "../../types/index.js";

/**
 * 公開ステータス DTO (公開安全サブセット)。これ以外のフィールドは絶対に増やさない。
 * 収益・コスト・採算・離脱率・利用数・raw_json・トークン・閾値・provider 識別子は含めない。
 */
export interface PublicServiceStatus {
  slug: string;
  name: string;
  url: string;
  status: "up" | "down" | "unknown";
  lastCheckedAt?: string;
}

/**
 * registry active サービス + 最新スナップショットから公開安全サブセットを投影する
 * (public-status-api、安全投影)。明示 DTO のみ構築し、内部 VM を流用しない (財務漏洩防止)。
 */
export function buildPublicStatus(
  services: ServiceDescriptor[],
  latest: SnapshotRow[],
): PublicServiceStatus[] {
  // up メトリクスの値と確認時刻を slug ごとに集約 (最新 capturedAt を採用)。
  // 状態確認日時 = up メトリクスの時刻 (他メトリクスの時刻は status とは無関係)。
  const upBySlug = new Map<string, { value: number; at: string }>();
  for (const s of latest) {
    if (s.metricKey !== "up") continue;
    const prev = upBySlug.get(s.serviceSlug);
    if (!prev || s.capturedAt > prev.at) {
      upBySlug.set(s.serviceSlug, { value: s.metricValue, at: s.capturedAt });
    }
  }
  return services
    .filter((svc) => svc.status === "active")
    .map((svc) => {
      const up = upBySlug.get(svc.slug);
      // up は 0/1 のはず。想定外の値 (NaN/0.5 等) は "down" と誤表示せず "unknown" に。
      const status: PublicServiceStatus["status"] =
        up == null ? "unknown" : up.value === 1 ? "up" : up.value === 0 ? "down" : "unknown";
      // 明示的に安全フィールドのみ構築 (スプレッド等で内部を巻き込まない)
      const out: PublicServiceStatus = { slug: svc.slug, name: svc.name, url: svc.url, status };
      if (up) out.lastCheckedAt = up.at;
      return out;
    });
}
