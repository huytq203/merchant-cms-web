"server-only";

import type { RowDataPacket } from "mysql2/promise";

export interface PermissionGroupResponse {
  id: string;
  name: string;
  status: "active" | "inactive";
  permissions: string[];
  userCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toPermissionGroupResponse(
  row: RowDataPacket,
  permissions: string[],
): PermissionGroupResponse {
  return {
    id: String(row.id),
    name: row.name as string,
    status: row.status as "active" | "inactive",
    permissions,
    userCount: Number(row.user_count ?? 0),
    createdBy: (row.created_by as string | null) ?? null,
    updatedBy: (row.updated_by as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
