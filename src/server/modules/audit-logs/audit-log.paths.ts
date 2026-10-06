// Merchant Portal endpoints (realm ewallet-merchant). The BE scopes entries to the session's Masters
// and has no export. Detail answers 404 for hidden and missing ids alike.
const MERCHANT = '/api/v1/merchant/audit-logs';

export const auditLogPaths = {
  list: MERCHANT,
  detail: (id: string) => `${MERCHANT}/${encodeURIComponent(id)}`,
} as const;
