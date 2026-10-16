/** Mirrors the BE `MerchantPermission` catalogue (48 names, 12 groups), in the BE display order. */
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
  "APPROVE_WITHDRAWAL",
  "APPROVE_BANK_ACCOUNT",
  "APPROVE_USER_SCOPE",
  "VIEW_TERMINAL",
  "MANAGE_TERMINAL",
  "LOCK_SUB_MERCHANT",
  "VIEW_BANK_ACCOUNT",
  "MANAGE_BANK_ACCOUNT",
  "MANAGE_API_KEY",
  "MANAGE_PAYMENT_METHOD",
  "MANAGE_NOTIFICATION",
  "VIEW_FEE_CONFIG",
  "MANAGE_FEE_CONFIG",
  "MANAGE_SETTLEMENT_CONFIG",
  "VIEW_ESCROW",
  "MANAGE_ESCROW_CONFIG",
  "CREATE_ESCROW_ORDER",
  "APPROVE_ESCROW_ORDER",
  "VIEW_HOLD",
  "MANAGE_HOLD_RULE",
  "RELEASE_HOLD_EARLY",
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
