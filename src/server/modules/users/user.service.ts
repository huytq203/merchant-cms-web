"server-only";

import bcrypt from "bcryptjs";
import { dbQuery } from "@/lib/db/db";
import type { ResultSetHeader } from "mysql2/promise";
import type { UserResponse } from "./user.entity";
import {
  findAllUsers,
  findUserById,
  insertUser,
  syncSubMerchants,
  updateUser,
  patchUserStatus,
  deleteUser,
  userExists,
  getPermissionGroupName,
  type FindAllUserParams,
} from "./user.repository";
import type { CreateUserInput, UpdateUserInput, PatchUserLockInput } from "@/app/api/v1/admin/merchants/users/types/schemas";

export interface PaginatedUsers {
  data: UserResponse[];
  pagination: { page: number; pageSize: number; total: number };
}

export async function getUserList(params: FindAllUserParams): Promise<PaginatedUsers> {
  return findAllUsers(params);
}

export async function getUserById(id: string): Promise<UserResponse | null> {
  return findUserById(id);
}

export async function createUser(input: CreateUserInput): Promise<UserResponse> {
  const now = new Date();
  const userId = Date.now().toString();
  const permissionGroupName = await getPermissionGroupName(input.permissionGroupId);

  await insertUser({
    id: userId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    permissionGroupId: input.permissionGroupId,
    permissionGroupName,
    subMerchantScope: input.subMerchantScope,
    now,
  });

  if (input.assignedSubMerchantsIds?.length) {
    await syncSubMerchants(userId, input.assignedSubMerchantsIds);
  }

  // Tạo login entry với mật khẩu mặc định
  const hashedPassword = await bcrypt.hash("111111", 10);
  await dbQuery<ResultSetHeader>(
    "INSERT INTO logins (id, user_id, username, password) VALUES (?, ?, ?, ?)",
    [(Date.now() + 1).toString(), userId, input.email, hashedPassword],
  );

  const created = await findUserById(userId);
  return created!;
}

export async function updateUserById(
  id: string,
  input: UpdateUserInput,
): Promise<UserResponse | null> {
  if (!(await userExists(id))) return null;

  let permissionGroupName: string | null | undefined;
  if (input.permissionGroupId) {
    permissionGroupName = await getPermissionGroupName(input.permissionGroupId);
  }

  await updateUser(id, {
    name: input.name,
    email: input.email,
    phone: input.phone,
    subMerchantScope: input.subMerchantScope,
    permissionGroupId: input.permissionGroupId,
    permissionGroupName,
  });

  if (input.assignedSubMerchantsIds !== undefined) {
    await syncSubMerchants(id, input.assignedSubMerchantsIds);
  }

  return findUserById(id);
}

export async function patchUserLock(
  id: string,
  input: PatchUserLockInput,
): Promise<UserResponse | null> {
  const existing = await findUserById(id);
  if (!existing) return null;

  const lockReason =
    input.lockReason !== undefined ? input.lockReason : existing.lockReason;
  const status = lockReason ? "locked" : "active";
  const lockedAt = lockReason ? (input.lockedAt ?? new Date().toISOString()) : null;

  await patchUserStatus(id, status, lockReason ?? null, lockedAt);
  return findUserById(id);
}

export async function removeUser(id: string): Promise<boolean> {
  if (!(await userExists(id))) return false;
  await deleteUser(id);
  return true;
}
