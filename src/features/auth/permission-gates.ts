import type { MerchantPermission } from "@/features/auth/permissions";

/**
 * Permissions the BE accepts (any-of) for each portal capability. Server guards, pages, the sidebar
 * and the dashboard all read this one table so they cannot drift apart.
 */
export const PERMISSION_GATES = {
  terminalRead: ["VIEW_TERMINAL", "MANAGE_TERMINAL"],
  terminalWrite: ["MANAGE_TERMINAL"],
  /**
   * Mở màn "Hiển thị QR tĩnh" cho khách (chốt 12/11/2026): thu ngân chỉ có CREATE_ORDER vẫn mở được;
   * phải khớp quyền BE của `POST /static-qrs/{id}/customer-display`.
   */
  staticQrDisplay: ["CREATE_ORDER", "VIEW_ORDER", "VIEW_TERMINAL", "MANAGE_TERMINAL"],
  subMerchantManage: ["MANAGE_SUB_MERCHANT"],
  subMerchantLock: ["LOCK_SUB_MERCHANT"],
  bankAccountRead: ["VIEW_BANK_ACCOUNT", "MANAGE_BANK_ACCOUNT", "CREATE_WITHDRAWAL"],
  bankAccountWrite: ["MANAGE_BANK_ACCOUNT"],
  userScopeApprove: ["APPROVE_USER_SCOPE"],
  sensitiveOtp: ["MANAGE_SUB_MERCHANT", "MANAGE_BANK_ACCOUNT"],
  /**
   * Who may read the light Sub list behind every Sub picker; must equal the BE `GET /sub-merchants/choices` gate.
   * Finance screens, Terminal, Order, User, Bank account and Complaint screens all show a Sub picker.
   */
  subMerchantChoices: [
    "MANAGE_SUB_MERCHANT",
    "VIEW_BALANCE", "VIEW_HOLD", "VIEW_REFUND", "VIEW_WITHDRAWAL", "CREATE_WITHDRAWAL",
    "VIEW_TERMINAL", "MANAGE_TERMINAL",
    "VIEW_ORDER", "CREATE_ORDER",
    "MANAGE_USER", "APPROVE_USER_SCOPE",
    "VIEW_BANK_ACCOUNT", "MANAGE_BANK_ACCOUNT",
    "VIEW_DISPUTE", "CREATE_DISPUTE",
  ],
} as const satisfies Record<string, readonly MerchantPermission[]>;
