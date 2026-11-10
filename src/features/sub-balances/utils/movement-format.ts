import { formatAmount } from "@/lib/utils/helper";

/** U+2212, a real minus sign: a hyphen reads as a dash next to digits and is easy to miss in a column of amounts. */
const MINUS = "−";

/** `+1.330.200 vnđ` / `−2.000.000 vnđ`; zero carries no sign. */
export function formatSignedAmount(amount: number): string {
  if (amount > 0) return `+${formatAmount(amount)}`;
  if (amount < 0) return `${MINUS}${formatAmount(-amount)}`;
  return formatAmount(0);
}

/** Credits are shown in the success color; debits keep the default text color (red would read as an error). */
export const amountToneClass = (amount: number): string => (amount > 0 ? "text-success" : "text-foreground");
