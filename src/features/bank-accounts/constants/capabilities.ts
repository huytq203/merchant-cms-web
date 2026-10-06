/**
 * Merchant Portal BE only exposes read access to bank accounts (/api/v1/merchant/bank-accounts).
 * Create, update, delete, set default and OTP are not open on the merchant path yet, so the UI hides
 * them instead of letting a click end in a 403. Turn this on once the BE opens writes for merchants.
 */
export const BANK_ACCOUNT_WRITES_ENABLED: boolean = false;
