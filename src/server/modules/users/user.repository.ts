"server-only";

import { prisma } from "@/lib/db/prisma";
import type { Prisma, UserStatus, SubMerchantScope } from "@prisma/client";
import { toUserResponse, type UserResponse } from "./user.entity";

const USER_INCLUDE = {
  permissionGroup: { select: { name: true } },
  assignedSubMerchants: { select: { subMerchantId: true } },
} satisfies Prisma.UserInclude;

export interface FindAllUserParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  permissionGroupId?: string | null;
  status?: string | null;
}

export async function findAllUsers(params: FindAllUserParams): Promise<{
  data: UserResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", page = 1, pageSize = 10, permissionGroupId, status } = params;

  const where: Prisma.UserWhereInput = {
    ...(keyword && { OR: [{ name: { contains: keyword } }, { email: { contains: keyword } }] }),
    ...(status && { status: status as UserStatus }),
    ...(permissionGroupId && { permissionGroupId }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: USER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { data: users.map(toUserResponse), pagination: { page, pageSize, total } };
}

export async function findUserById(id: string): Promise<UserResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: USER_INCLUDE,
  });
  return user ? toUserResponse(user) : null;
}

export async function insertUser(data: {
  id: string;
  name: string;
  email: string;
  phone: string;
  permissionGroupId: string;
  permissionGroupName: string | null;
  subMerchantScope: string;
  now: Date;
}): Promise<void> {
  await prisma.user.create({
    data: {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      permissionGroupId: data.permissionGroupId,
      permissionGroupName: data.permissionGroupName,
      subMerchantScope: data.subMerchantScope as SubMerchantScope,
      status: "active",
      createdAt: data.now,
      updatedAt: data.now,
    },
  });
}

export async function syncSubMerchants(userId: string, subMerchantIds: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.userAssignedSubMerchant.deleteMany({ where: { userId } }),
    ...(subMerchantIds.length > 0
      ? [
          prisma.userAssignedSubMerchant.createMany({
            data: subMerchantIds.map((subMerchantId) => ({ userId, subMerchantId })),
          }),
        ]
      : []),
  ]);
}

export async function updateUser(
  id: string,
  fields: Partial<{
    name: string;
    email: string;
    phone: string;
    permissionGroupId: string;
    permissionGroupName: string | null;
    subMerchantScope: string;
  }>,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.email !== undefined && { email: fields.email }),
      ...(fields.phone !== undefined && { phone: fields.phone }),
      ...(fields.subMerchantScope !== undefined && {
        subMerchantScope: fields.subMerchantScope as SubMerchantScope,
      }),
      ...(fields.permissionGroupId !== undefined && {
        permissionGroupId: fields.permissionGroupId,
        permissionGroupName: fields.permissionGroupName ?? null,
      }),
      updatedAt: new Date(),
    },
  });
}

export async function patchUserStatus(
  id: string,
  status: string,
  lockReason: string | null,
  lockedAt: string | null,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      status: status as UserStatus,
      lockReason,
      lockedAt: lockedAt ? new Date(lockedAt) : null,
      updatedAt: new Date(),
    },
  });
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

export async function userExists(id: string): Promise<boolean> {
  const count = await prisma.user.count({ where: { id } });
  return count > 0;
}

export async function getPermissionGroupName(groupId: string): Promise<string | null> {
  const group = await prisma.permissionGroup.findUnique({
    where: { id: groupId },
    select: { name: true },
  });
  return group?.name ?? null;
}
