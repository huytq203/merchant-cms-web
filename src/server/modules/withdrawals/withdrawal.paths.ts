// Merchant Portal endpoints (`/api/v1/merchant/withdrawal-requests`): scoped by the session, list/detail/create only.
// BE list takes pagination, transactionCode, status (several, comma separated), createdFrom and createdTo; the account number in responses is already masked by BE.
// Create takes { bankAccountId, amount, idempotencyKey, otp, reason? }: BE reads merchant, bank and holder from the stored account and checks the scope.
const MERCHANT = "/api/v1/merchant/withdrawal-requests";

export const withdrawalPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: MERCHANT,
  balance: `${MERCHANT}/balance`,
  otpChallenge: `${MERCHANT}/otp-challenge`,
} as const;
