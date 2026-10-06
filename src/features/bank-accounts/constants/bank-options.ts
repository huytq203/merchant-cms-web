/**
 * Bank catalogue for the account form.
 *
 * Source: the five banks in the Flexpay Merchant Portal mockup, screen 3.9 (LIÊN KẾT NGÂN HÀNG).
 * The BE has no bank-list endpoint: `bankCode` is a free string of at most 50 characters and
 * the codes below are the common short codes, not a BE-validated list. Replace this file with
 * a BE call as soon as an endpoint exists, and have the BE confirm the accepted codes.
 */
export const BANK_OPTIONS = [
  { value: "VCB", label: "Vietcombank" },
  { value: "TCB", label: "Techcombank" },
  { value: "BIDV", label: "BIDV" },
  { value: "ACB", label: "ACB" },
  { value: "MB", label: "MB Bank" },
] as const;
