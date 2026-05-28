import { useState } from "react";

/**
 * サービスアイコン表示コンポーネント (favicon-projection、CF-20260528-020 補完)。
 * iconUrl があれば <img> で表示、無い / load 失敗時は slug 頭文字の placeholder にフォールバック。
 * 内部 dashboard (ServiceRow.tsx) + admin UI (ServicesAdminView.tsx) で共通利用。
 */
export interface ServiceIconProps {
  iconUrl?: string;
  slug: string;
  /** 表示サイズ px (default 20、admin UI で 16 / 28 等に調整) */
  size?: number;
}

export function ServiceIcon({ iconUrl, slug, size = 20 }: ServiceIconProps) {
  const [failed, setFailed] = useState(false);
  const showImg = iconUrl && !failed;
  const initial = slug.charAt(0).toUpperCase();

  const wrapStyle = {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    width: size,
    height: size,
    marginRight: 6,
    verticalAlign: "middle" as const,
    borderRadius: 4,
    background: showImg ? "transparent" : "var(--accent-soft, #e6edf5)",
    color: "var(--text-muted, #5b6676)",
    fontSize: size * 0.55,
    fontWeight: 600,
    fontFamily: "system-ui, sans-serif",
    overflow: "hidden" as const,
    flexShrink: 0 as const,
  };

  return (
    <span style={wrapStyle} data-testid={`service-icon-${slug}`}>
      {showImg ? (
        <img
          src={iconUrl}
          alt=""
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: "contain" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
