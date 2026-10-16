import type { MerchantPermission } from "@/features/auth/permissions";

/**
 * Permissions the BE accepts (any-of) for each portal capability. Server guards, pages, the sidebar
 * and the dashboard all read this one table so they cannot drift apart.
 */
export const PERMISSION_GATES = {
  terminalRead: ["VIEW_TERMINAL", "MANAGE_TERMINAL"],
  terminalWrite: ["MANAGE_TERMINAL"],
  subMerchantManage: ["MANAGE_SUB_MERCHANT"],
  subMerchantLock: ["LOCK_SUB_MERCHANT"],
  bankAccountRead: ["VIEW_BANK_ACCOUNT", "MANAGE_BANK_ACCOUNT", "CREATE_WITHDRAWAL"],
  bankAccountWrite: ["MANAGE_BANK_ACCOUNT"],
  userScopeApprove: ["APPROVE_USER_SCOPE"],
} as const satisfies Record<string, readonly MerchantPermission[]>;
