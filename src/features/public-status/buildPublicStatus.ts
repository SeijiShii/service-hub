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
  const upBySlug = new Map<string, number>();
  const lastBySlug = new Map<string, string>();
  for (const s of latest) {
    if (s.metricKey === "up") upBySlug.set(s.serviceSlug, s.metricValue);
    const prev = lastBySlug.get(s.serviceSlug);
    if (!prev || s.capturedAt > prev) lastBySlug.set(s.serviceSlug, s.capturedAt);
  }
  return services
    .filter((svc) => svc.status === "active")
    .map((svc) => {
      const up = upBySlug.get(svc.slug);
      const status: PublicServiceStatus["status"] =
        up == null ? "unknown" : up === 1 ? "up" : "down";
      const lastCheckedAt = lastBySlug.get(svc.slug);
      // 明示的に安全フィールドのみ構築 (スプレッド等で内部を巻き込まない)
      const out: PublicServiceStatus = { slug: svc.slug, name: svc.name, url: svc.url, status };
      if (lastCheckedAt) out.lastCheckedAt = lastCheckedAt;
      return out;
    });
}
