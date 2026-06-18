import { useState } from "react";
import { ServiceIcon } from "../../components/ServiceIcon.js";
import { FEEDBACK_KINDS, type FeedbackKind } from "../../types/index.js";
import type { ChartPeriod } from "../dashboard/chartPeriod.js";
import { CHART_PERIODS } from "../dashboard/chartPeriod.js";
import { buildClaimText, type FeedbackInboxVM } from "./inbox.js";

/**
 * kind ごとのバッジ色 + ラベル。design-system のセマンティック状態色トークンに寄せる
 * (生値 hex の直書きをやめる=原則#3、絵文字なし=原則#4、色 + 文言で区別)。
 * chip スタイル: トークン色を文字 + 枠線に、面は `--surface-raised` (dark/影最小の面区別、SoT §影)。
 * feedback=accent (好意的な声) / bug=status-down (不具合) / inquiry=status-warn (要対応)。
 */
const KIND_BADGE: Record<FeedbackKind, { color: string; label: string }> = {
  feedback: { color: "var(--accent, #4f9cf9)", label: "ひとこと" },
  bug: { color: "var(--status-down, #f87171)", label: "不具合" },
  inquiry: { color: "var(--status-warn, #fbbf24)", label: "問い合わせ" },
};

export interface FeedbackInboxViewProps {
  vm: FeedbackInboxVM;
  service: string;
  kind: FeedbackKind | "";
  period: ChartPeriod;
  onServiceChange: (s: string) => void;
  onKindChange: (k: FeedbackKind | "") => void;
  onPeriodChange: (p: ChartPeriod) => void;
}

export function FeedbackInboxView({
  vm,
  service,
  kind,
  period,
  onServiceChange,
  onKindChange,
  onPeriodChange,
}: FeedbackInboxViewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const onTriage = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(id),
      () => setCopied(null),
    );
  };

  return (
    <main
      style={{
        background: "var(--bg, #0b0e14)",
        color: "var(--text, #e6e9ef)",
        padding: 16,
      }}
    >
      <header>
        <h1>フィードバック / 問い合わせ</h1>
        <p style={{ color: "var(--text-muted, #9aa4b2)" }}>
          各サービスに届いた声をまとめて確認できます
        </p>
      </header>

      <section
        data-testid="filters"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}
      >
        <label>
          サービス{" "}
          <select
            aria-label="サービスで絞り込む"
            value={service}
            onChange={(e) => onServiceChange(e.target.value)}
          >
            <option value="">すべて</option>
            {vm.services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          種別{" "}
          <select
            aria-label="種別で絞り込む"
            value={kind}
            onChange={(e) => onKindChange(e.target.value as FeedbackKind | "")}
          >
            <option value="">すべて</option>
            {FEEDBACK_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_BADGE[k].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          期間{" "}
          <select
            aria-label="期間で絞り込む"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as ChartPeriod)}
          >
            {CHART_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {vm.items.length === 0 ? (
        <p
          data-testid="empty-state"
          style={{ padding: "24px 0", textAlign: "center" }}
        >
          まだ届いていません
        </p>
      ) : (
        <ul
          data-testid="feedback-list"
          style={{ listStyle: "none", padding: 0 }}
        >
          {vm.items.map((item) => {
            const id = `${item.serviceSlug}:${item.externalId}`;
            const badge = KIND_BADGE[item.kind];
            return (
              <li
                key={id}
                data-testid="feedback-item"
                data-created={item.createdAt}
                style={{
                  background: "var(--surface, #131720)",
                  border: "1px solid var(--border, #232b3a)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ServiceIcon iconUrl={undefined} slug={item.serviceSlug} />
                  <span>{item.serviceName}</span>
                  <span
                    data-testid="kind-badge"
                    style={{
                      color: badge.color,
                      border: `1px solid ${badge.color}`,
                      background: "var(--surface-raised, #1b2230)",
                      borderRadius: 4,
                      padding: "1px 8px",
                      fontSize: 12,
                    }}
                  >
                    {badge.label}
                  </span>
                  <time
                    dateTime={item.createdAt}
                    style={{
                      marginLeft: "auto",
                      color: "var(--text-muted, #9aa4b2)",
                      fontSize: 12,
                    }}
                  >
                    {item.createdAt.slice(0, 10)}
                  </time>
                </div>
                <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>
                  {item.body}
                </p>
                <button
                  type="button"
                  onClick={() => onTriage(id, buildClaimText(item))}
                  style={{
                    color: "var(--accent, #4f9cf9)",
                    background: "transparent",
                    border: "1px solid var(--border, #232b3a)",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {copied === id ? "コピーしました" : "クレーム文をコピー"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
