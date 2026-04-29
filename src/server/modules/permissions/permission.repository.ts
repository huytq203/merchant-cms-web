"server-only";

import { prisma } from "@/lib/db/prisma";
import type { Prisma, PermissionGroupStatus } from "@prisma/client";
import { toPermissionGroupResponse, type PermissionGroupResponse } from "./permission.entity";

const PERMISSION_GROUP_INCLUDE = {
  _count: { select: { users: true } },
  permissions: { select: { permissionId: true } },
} satisfies Prisma.PermissionGroupInclude;

export interface FindAllPermissionParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllPermissionGroups(params: FindAllPermissionParams): Promise<{
  data: PermissionGroupResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", page = 1, pageSize = 10 } = params;

  const where: Prisma.PermissionGroupWhereInput = {
    ...(keyword && { name: { contains: keyword } }),
  };

  const [total, groups] = await Promise.all([
    prisma.permissionGroup.count({ where }),
    prisma.permissionGroup.findMany({
      where,
      include: PERMISSION_GROUP_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { data: groups.map(toPermissionGroupResponse), pagination: { page, pageSize, total } };
}

export async function findPermissionGroupById(id: string): Promise<PermissionGroupResponse | null> {
  const group = await prisma.permissionGroup.findUnique({
    where: { id },
    include: PERMISSION_GROUP_INCLUDE,
  });
  return group ? toPermissionGroupResponse(group) : null;
}

export async function insertPermissionGroup(data: {
  id: string;
  name: string;
  permissions: string[];
  now: Date;
}): Promise<void> {
  await prisma.permissionGroup.create({
    data: {
      id: data.id,
      name: data.name,
      status: "inactive",
      createdBy: "Admin_01",
      updatedBy: "Admin_01",
      createdAt: data.now,
      updatedAt: data.now,
      permissions: {
        create: data.permissions.map((permissionId) => ({ permissionId })),
      },
    },
  });
}

export async function syncPermissions(groupId: string, permissions: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.permissionGroupPermission.deleteMany({ where: { groupId } }),
    ...(permissions.length > 0
      ? [
          prisma.permissionGroupPermission.createMany({
            data: permissions.map((permissionId) => ({ groupId, permissionId })),
          }),
        ]
      : []),
  ]);
}

export async function updatePermissionGroup(
  id: string,
  fields: { name?: string; status?: string },
): Promise<void> {
  await prisma.permissionGroup.update({
    where: { id },
    data: {
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.status !== undefined && { status: fields.status as PermissionGroupStatus }),
      updatedBy: "admin",
      updatedAt: new Date(),
    },
  });
}
