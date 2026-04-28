"server-only";

import { dbQuery } from "@/lib/db/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { toPermissionGroupResponse, type PermissionGroupResponse } from "./permission.entity";

const GROUP_SELECT = `
  SELECT pg.id, pg.name, pg.status, pg.created_by, pg.updated_by,
         pg.created_at, pg.updated_at,
         COUNT(DISTINCT u.id) AS user_count
  FROM permission_groups pg
  LEFT JOIN users u ON u.permission_group_id = pg.id
`;

const GROUP_BY = `
  GROUP BY pg.id, pg.name, pg.status, pg.created_by, pg.updated_by, pg.created_at, pg.updated_at
`;

async function getPermissionsMap(groupIds: string[]): Promise<Record<string, string[]>> {
  if (groupIds.length === 0) return {};
  const placeholders = groupIds.map(() => "?").join(",");
  const rows = await dbQuery<RowDataPacket[]>(
    `SELECT group_id, permission_id FROM permission_group_permissions WHERE group_id IN (${placeholders})`,
    groupIds,
  );
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    const gid = row.group_id as string;
    if (!map[gid]) map[gid] = [];
    map[gid]!.push(row.permission_id as string);
  }
  return map;
}

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
  const conditions: string[] = [];
  const args: (string | number | null)[] = [];

  if (keyword) { conditions.push("pg.name LIKE ?"); args.push(`%${keyword}%`); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await dbQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM permission_groups pg ${where}`,
    args,
  );
  const total = Number(countRows[0]!.total);
  const offset = (page - 1) * pageSize;

  const groupRows = await dbQuery<RowDataPacket[]>(
    `${GROUP_SELECT} ${where} ${GROUP_BY} ORDER BY pg.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
    args,
  );

  const permMap = await getPermissionsMap(groupRows.map((g) => String(g.id)));
  const data = groupRows.map((g) =>
    toPermissionGroupResponse(g, permMap[String(g.id)] ?? []),
  );

  return { data, pagination: { page, pageSize, total } };
}

export async function findPermissionGroupById(id: string): Promise<PermissionGroupResponse | null> {
  const groupRows = await dbQuery<RowDataPacket[]>(
    `${GROUP_SELECT} WHERE pg.id = ? ${GROUP_BY}`,
    [id],
  );
  if (groupRows.length === 0) return null;

  const permMap = await getPermissionsMap([id]);
  return toPermissionGroupResponse(groupRows[0]!, permMap[id] ?? []);
}

export async function insertPermissionGroup(data: {
  id: string;
  name: string;
  permissions: string[];
  now: Date;
}): Promise<void> {
  await dbQuery<ResultSetHeader>(
    `INSERT INTO permission_groups (id, name, status, created_by, updated_by, created_at, updated_at)
     VALUES (?, ?, 'inactive', 'Admin_01', 'Admin_01', ?, ?)`,
    [data.id, data.name, data.now, data.now],
  );

  if (data.permissions.length > 0) {
    const placeholders = data.permissions.map(() => "(?, ?)").join(", ");
    const flat = data.permissions.flatMap((pid) => [data.id, pid]);
    await dbQuery<ResultSetHeader>(
      `INSERT INTO permission_group_permissions (group_id, permission_id) VALUES ${placeholders}`,
      flat,
    );
  }
}

export async function syncPermissions(groupId: string, permissions: string[]): Promise<void> {
  await dbQuery<ResultSetHeader>(
    "DELETE FROM permission_group_permissions WHERE group_id = ?",
    [groupId],
  );
  if (permissions.length === 0) return;
  const placeholders = permissions.map(() => "(?, ?)").join(", ");
  const flat = permissions.flatMap((pid) => [groupId, pid]);
  await dbQuery<ResultSetHeader>(
    `INSERT INTO permission_group_permissions (group_id, permission_id) VALUES ${placeholders}`,
    flat,
  );
}

export async function updatePermissionGroup(
  id: string,
  fields: { name?: string; status?: string },
): Promise<void> {
  const sets: string[] = ["updated_at = ?", "updated_by = 'admin'"];
  const values: (string | number | null | Date)[] = [new Date()];

  if (fields.name !== undefined) { sets.push("name = ?"); values.push(fields.name); }
  if (fields.status !== undefined) { sets.push("status = ?"); values.push(fields.status); }

  values.push(id);
  await dbQuery<ResultSetHeader>(
    `UPDATE permission_groups SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );
}
