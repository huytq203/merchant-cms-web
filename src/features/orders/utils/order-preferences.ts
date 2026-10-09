import { bankCodeSchema } from "../schemas/order.schema";

const LAST_BANK_KEY = "merchant-portal:order:last-bank";

/** Storage can be blocked or empty; the form then just starts without a bank chosen. */
export function readLastBank(): string {
  try {
    const parsed = bankCodeSchema.safeParse(window.localStorage.getItem(LAST_BANK_KEY));
    return parsed.success ? parsed.data : "";
  } catch {
    return "";
  }
}

export function writeLastBank(bankCode: string): void {
  try {
    window.localStorage.setItem(LAST_BANK_KEY, bankCode);
  } catch {
    // A convenience only; not remembering the bank is harmless.
  }
}
