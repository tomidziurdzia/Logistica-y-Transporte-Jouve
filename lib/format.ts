/** Formato argentino: $1.234.567,00 */
export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = value < 0 ? "-" : "";
  return `${sign}$${withDots},${decPart}`;
}
