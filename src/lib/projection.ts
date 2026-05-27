/**
 * 時系列の値配列 (等間隔・昇順想定、例: 月次) を最小二乗法で線形フィットし、
 * 末尾から ahead 期先の値を外挿する (business-observability Phase C)。
 * 2 点未満は傾きを推定できないため null。
 *
 * @param values 等間隔の観測値 (index 0..n-1)
 * @param ahead  何期先か (1 = 次の1期先)。複数指定で配列で返す。
 */
export function projectAhead(values: number[], ahead: number[]): (number | null)[] {
  const n = values.length;
  if (n < 2) return ahead.map(() => null);

  // 最小二乗法: index(0..n-1) を x、value を y として slope/intercept を求める。
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - meanX) * (values[i]! - meanY);
    den += (xs[i]! - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // 末尾 index は n-1。「1 期先」= index n。
  return ahead.map((k) => {
    const v = intercept + slope * (n - 1 + k);
    return Math.round(v * 1e6) / 1e6; // 浮動小数誤差を丸める
  });
}
