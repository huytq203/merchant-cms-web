// BE pagination: `page` is 1-based, `size` is 1..100; `sortBy` and `sortDirection` default to createdAt/DESC.
// Merchant Portal endpoints (`/api/v1/merchant/sub-merchants`): scoped by the session, ownership checked at Master level.
// List only paginates; detail/create/update/lock/unlock are served by the management controller on the same base path.
const MERCHANT = "/api/v1/merchant/sub-merchants";

export const subMerchantPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: MERCHANT,
  update: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  lock: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/lock`,
  unlock: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/unlock`,
} as const;
