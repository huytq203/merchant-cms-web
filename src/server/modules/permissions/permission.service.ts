"server-only";

import type { PermissionGroupResponse } from "./permission.entity";
import {
  findAllPermissionGroups,
  findPermissionGroupById,
  insertPermissionGroup,
  syncPermissions,
  updatePermissionGroup,
  type FindAllPermissionParams,
} from "./permission.repository";

export interface PaginatedPermissions {
  data: PermissionGroupResponse[];
  pagination: { page: number; pageSize: number; total: number };
}

export async function getPermissionList(
  params: FindAllPermissionParams,
): Promise<PaginatedPermissions> {
  return findAllPermissionGroups(params);
}

export async function getPermissionById(id: string): Promise<PermissionGroupResponse | null> {
  return findPermissionGroupById(id);
}

export async function createPermissionGroup(input: {
  name: string;
  permissions: string[];
}): Promise<PermissionGroupResponse> {
  const now = new Date();
  const id = Date.now().toString();

  await insertPermissionGroup({ id, name: input.name, permissions: input.permissions, now });
  return {
    id,
    name: input.name,
    status: "inactive",
    permissions: input.permissions,
    userCount: 0,
    createdBy: "Admin_01",
    updatedBy: "Admin_01",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updatePermissionGroupById(
  id: string,
  input: { name?: string; status?: string; permissions?: string[] },
): Promise<PermissionGroupResponse | null> {
  const existing = await findPermissionGroupById(id);
  if (!existing) return null;

  if (input.name !== undefined || input.status !== undefined) {
    await updatePermissionGroup(id, { name: input.name, status: input.status });
  }
  if (Array.isArray(input.permissions)) {
    await syncPermissions(id, input.permissions);
  }

  return findPermissionGroupById(id);
}
