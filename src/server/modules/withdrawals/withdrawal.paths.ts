// Merchant Portal endpoints (`/api/v1/merchant/withdrawal-requests`): scoped by the session, list/detail/create only.
// BE list takes pagination only; the account number in responses is already masked by BE.
// Create takes only { bankAccountId, amount, idempotencyKey, reason? }: BE reads merchant, bank and holder from the stored account and checks the scope.
const MERCHANT = "/api/v1/merchant/withdrawal-requests";

export const withdrawalPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: MERCHANT,
} as const;
