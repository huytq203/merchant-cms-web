import "server-only";

import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";

export function requireAuditAccess(): Promise<PermissionAccess> {
  return requirePermission("VIEW_AUDIT_LOG");
}
