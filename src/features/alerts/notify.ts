import type { AlertEvent } from "../../types/index.js";

export interface NotifyDeps {
  channel: (ev: AlertEvent) => Promise<void>; // Webhook/メール/no-op ([論点-AL1])
  markNotified: (id: string) => Promise<void>;
}

/** 未通知のアラートを送信し notifiedAt を更新。送信失敗時は markNotified しない (次回再試行)。 */
export async function notify(deps: NotifyDeps, events: AlertEvent[]): Promise<void> {
  for (const ev of events) {
    if (ev.notifiedAt) continue;
    await deps.channel(ev); // 失敗時は throw → markNotified に進まない
    await deps.markNotified(ev.id);
  }
}
