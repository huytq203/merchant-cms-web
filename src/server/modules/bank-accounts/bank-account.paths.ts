// Every call goes through the Merchant Portal chain: the admin chain rejects merchant-realm tokens.
// Link verification, hold mode and deciding a change request stay Flexpay-only and have no route here.
const MERCHANT = "/api/v1/merchant/bank-accounts";

export const bankAccountPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: MERCHANT,
  update: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  remove: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  setDefault: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/default`,
  otpChallenge: "/api/v1/merchant/sensitive-operations/otp-challenge",
} as const;
