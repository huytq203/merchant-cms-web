"server-only";

import { dbQuery } from "@/lib/db/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { toUserResponse, type UserResponse } from "./user.entity";

const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.phone,
         u.permission_group_id, u.sub_merchant_scope,
         u.status, u.lock_reason, u.locked_at,
         u.created_at, u.updated_at,
         pg.name AS permission_group_name
  FROM users u
  LEFT JOIN permission_groups pg ON pg.id = u.permission_group_id
`;

async function getAssignedSubMerchants(userIds: string[]): Promise<Record<string, string[]>> {
  if (userIds.length === 0) return {};
  const placeholders = userIds.map(() => "?").join(",");
  const rows = await dbQuery<RowDataPacket[]>(
    `SELECT user_id, sub_merchant_id FROM user_assigned_sub_merchants WHERE user_id IN (${placeholders})`,
    userIds,
  );
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    const uid = row.user_id as string;
    if (!map[uid]) map[uid] = [];
    map[uid]!.push(row.sub_merchant_id as string);
  }
  return map;
}

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
  const conditions: string[] = [];
  const args: (string | number | null)[] = [];

  if (keyword) {
    conditions.push("(u.name LIKE ? OR u.email LIKE ?)");
    args.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) { conditions.push("u.status = ?"); args.push(status); }
  if (permissionGroupId) { conditions.push("u.permission_group_id = ?"); args.push(permissionGroupId); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await dbQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users u ${where}`,
    args,
  );
  const total = Number(countRows[0]!.total);
  const offset = (page - 1) * pageSize;

  const userRows = await dbQuery<RowDataPacket[]>(
    `${USER_SELECT} ${where} ORDER BY u.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
    args,
  );

  const subMap = await getAssignedSubMerchants(userRows.map((u) => u.id as string));
  const data = userRows.map((u) => toUserResponse(u, subMap[u.id as string] ?? []));

  return { data, pagination: { page, pageSize, total } };
}

export async function findUserById(id: string): Promise<UserResponse | null> {
  const userRows = await dbQuery<RowDataPacket[]>(`${USER_SELECT} WHERE u.id = ?`, [id]);
  if (userRows.length === 0) return null;

  const subMap = await getAssignedSubMerchants([id]);
  return toUserResponse(userRows[0]!, subMap[id] ?? []);
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
  await dbQuery<ResultSetHeader>(
    `INSERT INTO users (id, name, email, phone, permission_group_id, permission_group_name,
                        sub_merchant_scope, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [data.id, data.name, data.email, data.phone, data.permissionGroupId,
     data.permissionGroupName, data.subMerchantScope, data.now, data.now],
  );
}

export async function syncSubMerchants(userId: string, subMerchantIds: string[]): Promise<void> {
  await dbQuery<ResultSetHeader>(
    "DELETE FROM user_assigned_sub_merchants WHERE user_id = ?",
    [userId],
  );
  if (subMerchantIds.length === 0) return;
  const placeholders = subMerchantIds.map(() => "(?, ?)").join(", ");
  const flat = subMerchantIds.flatMap((sid) => [userId, sid]);
  await dbQuery<ResultSetHeader>(
    `INSERT INTO user_assigned_sub_merchants (user_id, sub_merchant_id) VALUES ${placeholders}`,
    flat,
  );
}

export async function updateUser(
  id: string,
  fields: Partial<{
    name: string; email: string; phone: string;
    permissionGroupId: string; permissionGroupName: string | null;
    subMerchantScope: string;
  }>,
): Promise<void> {
  const sets: string[] = ["updated_at = ?"];
  const values: (string | number | null | Date)[] = [new Date()];

  if (fields.name !== undefined) { sets.push("name = ?"); values.push(fields.name); }
  if (fields.email !== undefined) { sets.push("email = ?"); values.push(fields.email); }
  if (fields.phone !== undefined) { sets.push("phone = ?"); values.push(fields.phone); }
  if (fields.subMerchantScope !== undefined) {
    sets.push("sub_merchant_scope = ?"); values.push(fields.subMerchantScope);
  }
  if (fields.permissionGroupId !== undefined) {
    sets.push("permission_group_id = ?"); values.push(fields.permissionGroupId);
    sets.push("permission_group_name = ?"); values.push(fields.permissionGroupName ?? null);
  }

  values.push(id);
  await dbQuery<ResultSetHeader>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );
}

export async function patchUserStatus(
  id: string,
  status: string,
  lockReason: string | null,
  lockedAt: string | null,
): Promise<void> {
  await dbQuery<ResultSetHeader>(
    "UPDATE users SET status = ?, lock_reason = ?, locked_at = ?, updated_at = ? WHERE id = ?",
    [status, lockReason, lockedAt, new Date(), id],
  );
}

export async function deleteUser(id: string): Promise<void> {
  await dbQuery<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
}

export async function userExists(id: string): Promise<boolean> {
  const rows = await dbQuery<RowDataPacket[]>("SELECT id FROM users WHERE id = ? LIMIT 1", [id]);
  return rows.length > 0;
}

export async function getPermissionGroupName(groupId: string): Promise<string | null> {
  const rows = await dbQuery<RowDataPacket[]>(
    "SELECT name FROM permission_groups WHERE id = ? LIMIT 1",
    [groupId],
  );
  return (rows[0]?.name as string) ?? null;
}
