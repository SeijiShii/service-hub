/**
 * 最終更新表示用フォーマッタ。
 * - 絶対時刻 = JST (UTC+9) で YYYY-MM-DD HH:MM
 * - 相対時刻 = 「N 秒前 / N 分前 / N 時間前 / N 日前」 (日本語)
 * - 入力 null → "未収集"
 * 決定的: 内部で `now` を引数 (デフォルト `new Date()`) で受ける → vi.setSystemTime と整合。
 */
export function formatLastUpdated(
  iso: string | null,
  now: Date = new Date(),
): string {
  if (!iso) return "未収集";
  const d = new Date(iso);
  return `${formatJst(d)} (${formatRelative(d, now)})`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC+9 (JST) で YYYY-MM-DD HH:MM。サマータイムなし。 */
function formatJst(d: Date): string {
  const t = d.getTime() + 9 * 3600 * 1000;
  const j = new Date(t);
  return `${j.getUTCFullYear()}-${pad(j.getUTCMonth() + 1)}-${pad(j.getUTCDate())} ${pad(j.getUTCHours())}:${pad(j.getUTCMinutes())}`;
}

function formatRelative(d: Date, now: Date): string {
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${Math.max(0, sec)} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 時間前`;
  const day = Math.floor(hour / 24);
  return `${day} 日前`;
}
