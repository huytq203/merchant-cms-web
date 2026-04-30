"server-only";

import type { Prisma } from "@prisma/client";

export type PermissionGroupWithRelations = Prisma.PermissionGroupGetPayload<{
  include: {
    _count: { select: { users: true } };
    permissions: { select: { permissionId: true } };
  };
}>;

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
  group: PermissionGroupWithRelations,
): PermissionGroupResponse {
  return {
    id: group.id,
    name: group.name,
    status: group.status,
    permissions: group.permissions.map((p) => p.permissionId),
    userCount: group._count.users,
    createdBy: group.createdBy ?? null,
    updatedBy: group.updatedBy ?? null,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}
