/** Mirrors the BE `MerchantPermission` enum (27 names, 7 groups). */
export const MERCHANT_PERMISSIONS = [
  "VIEW_TRANSACTION",
  "EXPORT_TRANSACTION",
  "CREATE_REFUND",
  "CANCEL_REFUND",
  "APPROVE_REFUND",
  "VIEW_REFUND",
  "CREATE_DISPUTE",
  "REPLY_DISPUTE",
  "VIEW_DISPUTE",
  "CREATE_ORDER",
  "CANCEL_ORDER",
  "VIEW_ORDER",
  "CONFIRM_ORDER",
  "CREATE_WITHDRAWAL",
  "VIEW_WITHDRAWAL",
  "EXPORT_WITHDRAWAL",
  "VIEW_BALANCE",
  "EXPORT_BALANCE",
  "VIEW_AUDIT_LOG",
  "MANAGE_USER",
  "MANAGE_SUB_MERCHANT",
  "MANAGE_PERMISSION_GROUP",
  "VIEW_WALLET",
  "TOPUP_WALLET",
  "WITHDRAW_WALLET",
  "TRANSFER_WALLET",
  "EXPORT_WALLET_STATEMENT",
] as const;

export type MerchantPermission = (typeof MERCHANT_PERMISSIONS)[number];

const KNOWN = new Set<string>(MERCHANT_PERMISSIONS);

export function isMerchantPermission(value: string): value is MerchantPermission {
  return KNOWN.has(value);
}

export function hasPermission(
  permissions: readonly MerchantPermission[],
  required: MerchantPermission,
): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(
  permissions: readonly MerchantPermission[],
  required: readonly MerchantPermission[],
): boolean {
  return required.some((permission) => permissions.includes(permission));
}
