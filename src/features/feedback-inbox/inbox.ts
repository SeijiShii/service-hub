/**
 * feedback-inbox ビューモデル整形 ([論点-007]/O67)。
 * フィルタ正規化 / slug→name 解決 / トリアージ用 claim テンプレ生成。
 */
import type {
  FeedbackItemRow,
  FeedbackFilter,
  FeedbackKind,
  ServiceDescriptor,
} from "../../types/index.js";
import { FEEDBACK_KINDS } from "../../types/index.js";
import {
  parsePeriod,
  periodToSinceIso,
  DEFAULT_PERIOD,
} from "../dashboard/chartPeriod.js";

export interface FeedbackInboxItem extends FeedbackItemRow {
  /** slug→表示名解決 (未登録 slug は slug をそのまま表示)。 */
  serviceName: string;
}

export interface FeedbackInboxVM {
  items: FeedbackInboxItem[];
  /** フィルタ用サービス一覧 (active)。 */
  services: { slug: string; name: string }[];
}

const KIND_SET = new Set<string>(FEEDBACK_KINDS);

type Query = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/**
 * クエリから取得フィルタを構築。`period` (all/30d/7d、既定 30d) を since に変換。
 * service/kind は妥当な値のみ採用 (不正値は無視)。
 */
export function parseFeedbackFilter(query: Query, nowMs: number): FeedbackFilter {
  const filter: FeedbackFilter = {};
  const service = first(query.service);
  if (service) filter.service = service;
  const kind = first(query.kind);
  if (kind && KIND_SET.has(kind)) filter.kind = kind as FeedbackKind;
  const period = parsePeriod(first(query.period) ?? DEFAULT_PERIOD);
  filter.since = periodToSinceIso(period, nowMs);
  return filter;
}

/** トリアージ用: 運営者が対象 repo の `/flow:claim` に貼れるテキストを生成。 */
export function buildClaimText(item: FeedbackInboxItem): string {
  const lines = [
    `[${item.serviceName} / ${item.kind}] ${item.createdAt}`,
    item.body,
  ];
  if (item.rating !== undefined) lines.push(`rating: ${item.rating}`);
  if (item.status) lines.push(`status: ${item.status}`);
  return lines.join("\n");
}

/** 取得済み行 + サービス一覧から inbox VM を構築。 */
export function buildInboxVM(
  rows: FeedbackItemRow[],
  services: Pick<ServiceDescriptor, "slug" | "name">[],
): FeedbackInboxVM {
  const nameBySlug = new Map(services.map((s) => [s.slug, s.name]));
  return {
    items: rows.map((r) => ({
      ...r,
      serviceName: nameBySlug.get(r.serviceSlug) ?? r.serviceSlug,
    })),
    services: services.map((s) => ({ slug: s.slug, name: s.name })),
  };
}
