// list and detail use the Merchant Portal endpoints (read only, account number already masked by the BE).
// Everything else below still points at the admin chain, which rejects merchant-realm tokens: the BE has no
// merchant route for writes until OTP is opened to merchant users. The UI hides these actions
// (see BANK_ACCOUNT_WRITES_ENABLED); move them to /api/v1/merchant/... when the BE ships them.
const MERCHANT = "/api/v1/merchant/bank-accounts";
const BANK_ACCOUNTS = "/api/v1/admin/merchant-bank-accounts";

export const bankAccountPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: BANK_ACCOUNTS,
  update: (id: string) => `${BANK_ACCOUNTS}/${encodeURIComponent(id)}`,
  remove: (id: string) => `${BANK_ACCOUNTS}/${encodeURIComponent(id)}`,
  setDefault: (id: string) => `${BANK_ACCOUNTS}/${encodeURIComponent(id)}/default`,
  verifyLink: (id: string) => `${BANK_ACCOUNTS}/${encodeURIComponent(id)}/link-verification`,
  otpChallenge: "/api/v1/admin/sensitive-operations/otp-challenge",
} as const;
