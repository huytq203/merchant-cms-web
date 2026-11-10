// BE pagination: `page` is 1-based, `size` is 1..100; `sortBy` and `sortDirection` default to createdAt/DESC.
// Merchant Portal endpoints (`/api/v1/merchant/sub-merchants`): scoped by the session, ownership checked at Master level.
// List filters by code/name/status/Master/receiving account/created date in the BE query; detail/create/update/lock/unlock
// are served by the management controller on the same base path.
const MERCHANT = "/api/v1/merchant/sub-merchants";

export const subMerchantPaths = {
  list: MERCHANT,
  /**
   * Read-only {id, code, name, status, merchantId, isDefault} of the session's Subs (cap 500, no paging). Open to every
   * screen with a Sub picker (PERMISSION_GATES.subMerchantChoices), not only MANAGE_SUB_MERCHANT.
   */
  choices: `${MERCHANT}/choices`,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  create: MERCHANT,
  update: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
  lock: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/lock`,
  unlock: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}/unlock`,
} as const;
