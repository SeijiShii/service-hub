import type {
  ServiceDescriptor,
  ProviderAdapter,
  ServiceMeta,
  SnapshotRow,
  CollectionRun,
  CollectionStatus,
} from "../../types/index.js";

export interface RunnerDeps {
  loadServices: () => Promise<ServiceDescriptor[]>; // active のみ返す想定 (DB SoT)
  getAdapters: (s: ServiceDescriptor) => ProviderAdapter[];
  saveSnapshots: (rows: SnapshotRow[]) => Promise<void>;
  saveRun: (run: CollectionRun) => Promise<void>;
  onCollected?: (
    rows: SnapshotRow[],
    services: ServiceDescriptor[],
  ) => Promise<void>; // alerts hook
  /**
   * adapter から受け取った producer 申告メタ (iconUrl 等) を services テーブルへ永続化する hook
   * (favicon-projection、spec-review R1)。service-info adapter が meta を返したときのみ呼ばれる。
   * テストでは mock 注入可能、本番は api/cron/collect.ts で updateServiceMeta(db, slug, meta) を渡す。
   */
  updateServiceMeta?: (slug: string, meta: ServiceMeta) => Promise<void>;
  now?: () => Date;
  newId?: () => string;
}

/** 1 ラン分の収集オーケストレーション。throw せず CollectionRun を返す。 */
export async function runCollection(deps: RunnerDeps): Promise<CollectionRun> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? (() => crypto.randomUUID());
  const startedAt = now().toISOString();
  const services = await deps.loadServices();
  const rows: SnapshotRow[] = [];
  const errors: NonNullable<CollectionRun["errors"]> = [];
  let attempted = 0;

  for (const svc of services) {
    for (const adapter of deps.getAdapters(svc)) {
      attempted++;
      try {
        const res = await adapter.collect(svc);
        if (res.error)
          errors.push({
            serviceSlug: svc.slug,
            provider: adapter.kind,
            message: res.error,
          });
        for (const m of res.metrics) {
          // fix C20260607-002: producer 申告の不正値で batch insert 全体を壊さない (1 producer の
          // 不備で全サービスの collect が落ちる事故を防ぐ、C20260601-003 と同系)。
          // - unit 欠落 (非 string): NOT NULL カラムに undefined → SQL `default` → 制約違反。"" に矯正。
          // - value 非有限 (NaN/Infinity/非数): 数値カラムを壊すため当該 metric を skip (警告)。
          if (!Number.isFinite(m.value)) {
            console.warn(
              `skip non-finite metric: slug=${svc.slug} provider=${m.provider} key=${m.key}`,
            );
            continue;
          }
          rows.push({
            id: newId(),
            serviceSlug: svc.slug,
            provider: m.provider,
            metricKey: m.key,
            metricValue: m.value,
            unit: typeof m.unit === "string" ? m.unit : "",
            // fix C20260601-002: 1 run = 単一 capturedAt 不変条件。行ごとに now() を呼ぶと
            // 本番 (api/cron/collect が now 未注入) で per-row ミリ秒ドリフトが起き chart が崩れる。
            // run 開始時刻 startedAt を全 SnapshotRow で共有する。
            capturedAt: startedAt,
          });
        }
        // adapter からの producer 申告メタを services テーブルへ永続化 (favicon-projection、spec-review R1)。
        // service-info adapter のみ meta を返す。失敗は collect 全体を壊さない (warn 出力で運用可視性)。
        if (res.meta && deps.updateServiceMeta) {
          try {
            await deps.updateServiceMeta(svc.slug, res.meta);
          } catch (e) {
            console.warn(
              `updateServiceMeta failed: slug=${svc.slug} reason=${e instanceof Error ? e.message : "error"}`,
            );
          }
        }
      } catch (e) {
        errors.push({
          serviceSlug: svc.slug,
          provider: adapter.kind,
          message: e instanceof Error ? e.message : "error",
        });
      }
    }
  }

  let status: CollectionStatus = "ok";
  let dbFailed = false;
  try {
    await deps.saveSnapshots(rows);
    if (deps.onCollected) await deps.onCollected(rows, services);
  } catch (e) {
    dbFailed = true;
    errors.push({
      serviceSlug: "*",
      provider: "ping",
      message: `db: ${e instanceof Error ? e.message : "error"}`,
    });
  }

  if (dbFailed || (attempted > 0 && errors.length >= attempted))
    status = "failed";
  else if (errors.length > 0) status = "partial";

  const run: CollectionRun = {
    id: newId(),
    startedAt,
    finishedAt: now().toISOString(),
    status,
    servicesCount: services.length,
    errors: errors.length ? errors : undefined,
  };
  await deps.saveRun(run);
  return run;
}
