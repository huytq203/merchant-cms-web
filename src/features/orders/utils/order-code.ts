/** A readable, practically unique code such as `DH261009-4821`; the merchant may overwrite it. */
export function generateOrderCode(now: Date = new Date(), random: () => number = Math.random): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  return `DH${day}-${1000 + Math.floor(random() * 9000)}`;
}
