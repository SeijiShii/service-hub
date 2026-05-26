import type { AlertEvent, ServiceDescriptor, SnapshotRow } from "../../types/index.js";

export interface AlertDeps {
  getOpenAlerts: () => Promise<AlertEvent[]>;
  recordAlert: (ev: AlertEvent) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  now?: () => Date;
  newId?: () => string;
}

const keyOf = (slug: string, provider: string, rule: string) => `${slug}|${provider}|${rule}`;

/** 収集スナップショットを閾値判定。新規発火分を返す。継続中は再発火せず、回復で resolve。 */
export async function evaluate(
  deps: AlertDeps,
  snapshots: SnapshotRow[],
  services: ServiceDescriptor[],
): Promise<AlertEvent[]> {
  const now = (deps.now ?? (() => new Date()))().toISOString();
  const newId = deps.newId ?? (() => crypto.randomUUID());
  const open = await deps.getOpenAlerts();
  const openByKey = new Map(open.map((a) => [keyOf(a.serviceSlug, a.provider, a.rule), a]));
  const thresholdsBySlug = new Map(services.map((s) => [s.slug, s.thresholds]));

  // (slug,provider,rule) -> 発火中か
  const firing = new Set<string>();
  const fired: AlertEvent[] = [];

  const fire = async (s: SnapshotRow, rule: string, value: number) => {
    const k = keyOf(s.serviceSlug, s.provider, rule);
    firing.add(k);
    if (openByKey.has(k)) return; // 継続中 → 再発火しない (重複抑制)
    const ev: AlertEvent = {
      id: newId(), serviceSlug: s.serviceSlug, provider: s.provider, rule,
      triggeredAt: now, value,
    };
    await deps.recordAlert(ev);
    fired.push(ev);
  };

  for (const s of snapshots) {
    if (s.metricKey === "up" && s.metricValue === 0) {
      await fire(s, "down", 0);
      continue;
    }
    const th = thresholdsBySlug.get(s.serviceSlug)?.[s.metricKey];
    if (th?.limit != null && s.metricValue >= th.limit) {
      await fire(s, "free_tier_over", s.metricValue);
    } else if (th?.limit != null && th.warnPct != null && (s.metricValue / th.limit) * 100 >= th.warnPct) {
      await fire(s, "free_tier_80pct", s.metricValue);
    }
  }

  // 回復: 未発火になった open アラートを resolve
  for (const a of open) {
    if (!firing.has(keyOf(a.serviceSlug, a.provider, a.rule))) {
      await deps.resolveAlert(a.id);
    }
  }
  return fired;
}
