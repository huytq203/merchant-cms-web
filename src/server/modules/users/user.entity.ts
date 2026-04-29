"server-only";

import type { Prisma } from "@prisma/client";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    permissionGroup: { select: { name: true } };
    assignedSubMerchants: { select: { subMerchantId: true } };
  };
}>;

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  permissionGroupId: string | null;
  permissionGroupName: string | null;
  subMerchantScope: "all" | "specific";
  assignedSubMerchantsIds: string[];
  assignedSubMerchantCount: number;
  status: "active" | "locked";
  lockReason: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toUserResponse(user: UserWithRelations): UserResponse {
  const subMerchantIds = user.assignedSubMerchants.map((a) => a.subMerchantId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    permissionGroupId: user.permissionGroupId ?? null,
    permissionGroupName: user.permissionGroup?.name ?? user.permissionGroupName ?? null,
    subMerchantScope: user.subMerchantScope,
    assignedSubMerchantsIds: subMerchantIds,
    assignedSubMerchantCount: subMerchantIds.length,
    status: user.status,
    lockReason: user.lockReason ?? null,
    lockedAt: user.lockedAt ? user.lockedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
