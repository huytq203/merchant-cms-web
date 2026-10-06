// Merchant Portal endpoints (`/api/v1/merchant/terminals`): scoped by the session, ownership checked at Master level.
// List filters BE reads: name, status, subMerchantId and pagination.
const MERCHANT = "/api/v1/merchant/terminals";

export const terminalPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: MERCHANT,
  update: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  lock: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/lock`,
  unlock: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/unlock`,
} as const;
