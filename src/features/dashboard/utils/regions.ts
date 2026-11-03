import { hasAnyPermission, hasPermission, type MerchantPermission } from "@/features/auth/permissions";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";

/** Which dashboard regions a session may see; each one needs the permission of the page it summarises. */
export function visibleRegions(permissions: readonly MerchantPermission[]) {
  const orders = hasPermission(permissions, "VIEW_ORDER");
  const withdrawals = hasPermission(permissions, "VIEW_WITHDRAWAL");
  const terminals = hasAnyPermission(permissions, PERMISSION_GATES.terminalRead);
  // Revenue per Sub is built from the settlement items, which need VIEW_BALANCE like their own page.
  const revenue = hasPermission(permissions, "VIEW_BALANCE");
  return {
    orders,
    withdrawals,
    terminals,
    revenue,
    statCards: (orders ? 3 : 0) + (terminals ? 1 : 0),
    any: orders || withdrawals || terminals || revenue,
  };
}
