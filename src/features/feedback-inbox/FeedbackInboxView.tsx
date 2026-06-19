import { useState, type CSSProperties } from "react";
import { ServiceIcon } from "../../components/ServiceIcon.js";
import { FEEDBACK_KINDS, type FeedbackKind } from "../../types/index.js";
import type { ChartPeriod } from "../dashboard/chartPeriod.js";
import { CHART_PERIODS } from "../dashboard/chartPeriod.js";
import { buildClaimText, type FeedbackInboxVM } from "./inbox.js";

/**
 * kind ごとのバッジ色 + ラベル。design-system のセマンティック状態色トークンに寄せる
 * (生値 hex の直書きをやめる=原則#3、絵文字なし=原則#4、色 + 文言で区別)。
 * feedback=accent (好意的な声) / bug=status-down (不具合) / inquiry=status-warn (要対応)。
 */
const KIND_BADGE: Record<FeedbackKind, { color: string; label: string }> = {
  feedback: { color: "var(--accent, #4f9cf9)", label: "ひとこと" },
  bug: { color: "var(--status-down, #f87171)", label: "不具合" },
  inquiry: { color: "var(--status-warn, #fbbf24)", label: "問い合わせ" },
};

/** token 化したフォームコントロール共通スタイル (raw browser-default を避ける、原則#3)。 */
const CONTROL: CSSProperties = {
  background: "var(--surface-raised, #1b2230)",
  color: "var(--text, #e6e9ef)",
  border: "1px solid var(--border, #232b3a)",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 13,
};
const FIELD_LABEL: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "var(--text-muted, #9aa4b2)",
  fontSize: 13,
};

/** 「今すぐ pull」操作の UI state (dashboard ForcePullState と同型、inbox からも手動取り込み)。 */
export interface InboxPullState {
  running?: boolean;
  error?: string;
}

export interface FeedbackInboxViewProps {
  vm: FeedbackInboxVM;
  service: string;
  kind: FeedbackKind | "";
  period: ChartPeriod;
  onServiceChange: (s: string) => void;
  onKindChange: (k: FeedbackKind | "") => void;
  onPeriodChange: (p: ChartPeriod) => void;
  /** 指定時のみインボックス内に「今すぐ pull」ボタンを表示 (POST /api/admin/collect → refetch)。 */
  onForcePull?: () => void;
  forcePullState?: InboxPullState;
}

export function FeedbackInboxView({
  vm,
  service,
  kind,
  period,
  onServiceChange,
  onKindChange,
  onPeriodChange,
  onForcePull,
  forcePullState,
}: FeedbackInboxViewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const running = forcePullState?.running ?? false;

  const onTriage = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(id),
      () => setCopied(null),
    );
  };

  // kind segmented chips: 「すべて」+ 各 kind。選択中は accent、非選択は muted (token のみ)。
  const kindChips: { value: FeedbackKind | ""; label: string }[] = [
    { value: "", label: "すべて" },
    ...FEEDBACK_KINDS.map((k) => ({ value: k, label: KIND_BADGE[k].label })),
  ];

  return (
    <main
      style={{
        background: "var(--bg, #0b0e14)",
        color: "var(--text, #e6e9ef)",
        padding: 16,
      }}
    >
      <header>
        <nav style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <a
            href="/"
            data-testid="home-link"
            style={{
              color: "var(--text, #e6e9ef)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--border, #232b3a)",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            ← ホーム
          </a>
          {onForcePull && (
            <span
              data-section="force-pull"
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
            >
              <button
                type="button"
                onClick={onForcePull}
                disabled={running}
                style={{
                  background: "transparent",
                  color: "var(--text, #e6e9ef)",
                  border: "1px solid var(--border, #232b3a)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 13,
                  cursor: running ? "not-allowed" : "pointer",
                  opacity: running ? 0.6 : 1,
                }}
              >
                {running ? "実行中…" : "今すぐ pull"}
              </button>
              {forcePullState?.error && (
                <span
                  role="alert"
                  style={{ color: "var(--status-down, #f87171)", fontSize: 12 }}
                >
                  {forcePullState.error}
                </span>
              )}
            </span>
          )}
        </nav>
        <h1 style={{ marginBottom: 4 }}>フィードバック / 問い合わせ</h1>
        <p style={{ margin: 0, color: "var(--text-muted, #9aa4b2)" }}>
          全サービスに届いた声をまとめて確認できます
        </p>
        {/* 統合インボックスの明示: 表示中の件数サマリ (全 N 件 + kind 別) */}
        <p
          data-testid="count-summary"
          style={{
            margin: "8px 0 0",
            color: "var(--text-muted, #9aa4b2)",
            fontSize: 13,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          全 {vm.counts.total} 件
          {vm.counts.total > 0 && (
            <>
              （{KIND_BADGE.feedback.label} {vm.counts.byKind.feedback} /{" "}
              {KIND_BADGE.bug.label} {vm.counts.byKind.bug} /{" "}
              {KIND_BADGE.inquiry.label} {vm.counts.byKind.inquiry}）
            </>
          )}
        </p>
      </header>

      <section
        data-testid="filters"
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          margin: "12px 0",
        }}
      >
        <label style={FIELD_LABEL}>
          サービス
          <select
            aria-label="サービスで絞り込む"
            value={service}
            onChange={(e) => onServiceChange(e.target.value)}
            style={CONTROL}
          >
            <option value="">すべてのサービス</option>
            {vm.services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {/* kind は segmented chips (ワンタップ切替、選択状態が視認できる) */}
        <div
          role="group"
          aria-label="種別で絞り込む"
          style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}
        >
          {kindChips.map((c) => {
            const active = kind === c.value;
            return (
              <button
                key={c.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => onKindChange(c.value)}
                style={{
                  ...CONTROL,
                  cursor: "pointer",
                  color: active
                    ? "var(--accent, #4f9cf9)"
                    : "var(--text-muted, #9aa4b2)",
                  borderColor: active
                    ? "var(--accent, #4f9cf9)"
                    : "var(--border, #232b3a)",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <label style={FIELD_LABEL}>
          期間
          <select
            aria-label="期間で絞り込む"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as ChartPeriod)}
            style={CONTROL}
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
          style={{
            padding: "32px 0",
            textAlign: "center",
            color: "var(--text-muted, #9aa4b2)",
          }}
        >
          まだ届いていません
        </p>
      ) : (
        <ul
          data-testid="feedback-list"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {vm.items.map((item) => {
            const id = `${item.serviceSlug}:${item.externalId}`;
            const badge = KIND_BADGE[item.kind];
            // 返信導線 (inquiries 由来、context jsonb から)。email/adminUrl 不在なら出さない。
            const ctx = item.context as
              | { email?: unknown; adminUrl?: unknown; subject?: unknown }
              | undefined;
            const email =
              typeof ctx?.email === "string" ? ctx.email : undefined;
            const adminUrl =
              typeof ctx?.adminUrl === "string" ? ctx.adminUrl : undefined;
            const subject =
              typeof ctx?.subject === "string" ? ctx.subject : undefined;
            const mailtoHref = email
              ? `mailto:${email}${subject ? `?subject=${encodeURIComponent(`Re: ${subject}`)}` : ""}`
              : undefined;
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
                  <span style={{ fontWeight: 600 }}>{item.serviceName}</span>
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
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {item.createdAt.slice(0, 10)}
                  </time>
                </div>
                <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>
                  {item.body}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {mailtoHref && (
                    <a
                      href={mailtoHref}
                      data-testid="reply-email"
                      style={{
                        color: "var(--accent, #4f9cf9)",
                        background: "transparent",
                        border: "1px solid var(--border, #232b3a)",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 13,
                        textDecoration: "none",
                      }}
                    >
                      メールで返信
                    </a>
                  )}
                  {adminUrl && (
                    <a
                      href={adminUrl}
                      data-testid="reply-admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--text-muted, #9aa4b2)",
                        background: "transparent",
                        border: "1px solid var(--border, #232b3a)",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 13,
                        textDecoration: "none",
                      }}
                    >
                      {item.serviceName} で返信
                    </a>
                  )}
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
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
