import type { AccountSim } from "./simulate.js";

export interface CostSimResponse {
  accounts: AccountSim[];
  pricingUpdated: string;
  stale: boolean;
}

const REC_LABEL: Record<AccountSim["recommendation"], string> = {
  keep: "継続（無料枠内）",
  upgrade: "格上げ（収益が見合う）",
  consolidate: "統合（無料枠に収める）",
  sunset: "撤退（収益が見合わない）",
};

const pct = (v: number) => `${Math.round(v * 100)}%`;
const usd = (v: number) => `$${v.toFixed(2)}`;

/** 無料枠コストシミュレーション + 格上げ提案ビュー (business-observability Phase D)。 */
export function CostSimView({ data }: { data: CostSimResponse }) {
  return (
    <main style={{ background: "var(--bg, #0b0e14)", color: "var(--text, #e6e9ef)" }}>
      <header>
        <h1>コストシミュレーション</h1>
        <p data-pricing-updated>
          料金データ更新日: {data.pricingUpdated}
          {data.stale && <strong data-stale>（古い可能性 — 最新料金で再確認を推奨）</strong>}
        </p>
      </header>
      {data.accounts.length === 0 ? (
        <p data-testid="empty-state">対象アカウントの使用量データがありません</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>provider/アカウント</th>
              <th>サービス数</th>
              <th>無料枠消費</th>
              <th>上限到達</th>
              <th>格上げ額/合算収益</th>
              <th>提案</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.map((a) => (
              <tr key={`${a.provider} ${a.account}`} data-account={a.account} data-rec={a.recommendation}>
                <td style={{ fontFamily: "ui-monospace, monospace" }}>{a.provider} / {a.account}</td>
                <td style={{ textAlign: "right" }}>{a.serviceCount}</td>
                <td style={{ textAlign: "right" }} data-usage-pct>{pct(a.maxUsagePct)}</td>
                <td style={{ textAlign: "right" }}>
                  {a.daysToCeiling == null ? "—" : `${a.daysToCeiling}日`}
                </td>
                <td style={{ textAlign: "right" }}>
                  {usd(a.upgradeCostUsd)} / {usd(a.aggregateRevenueUsd)}
                </td>
                <td data-rec-label>{REC_LABEL[a.recommendation]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
