import "server-only";

import { emptySchema, pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import {
  permissionCatalogSchema,
  permissionGroupSchema,
  permissionGroupUserSchema,
  type PermissionCatalogItem,
  type PermissionGroup,
  type PermissionGroupFormValues,
  type PermissionGroupUser,
} from "@/features/permission/schemas/permission-group.schema";
import { toGroupRequest } from "@/features/permission/utils/permission-group-mapper";
import { permissionGroupPaths } from "./permission-group.paths";

export interface PermissionGroupFilter {
  merchantId: string;
  page: number;
  pageSize: number;
  query?: string;
  systemOnly?: boolean;
}

export interface PermissionGroupPage<T> {
  rows: T[];
  total: number;
}

export function listPermissionCatalog(): Promise<BeResult<PermissionCatalogItem[]>> {
  return merchantClient().get({ path: permissionGroupPaths.catalog, schema: permissionCatalogSchema });
}

export async function listPermissionGroups(filter: PermissionGroupFilter): Promise<BeResult<PermissionGroupPage<PermissionGroup>>> {
  const result = await merchantClient().get({
    path: permissionGroupPaths.list,
    schema: pageSchema(permissionGroupSchema),
    query: {
      merchantId: filter.merchantId,
      page: filter.page,
      size: filter.pageSize,
      query: filter.query,
      systemOnly: filter.systemOnly,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export function getPermissionGroup(id: string): Promise<BeResult<PermissionGroup>> {
  return merchantClient().get({ path: permissionGroupPaths.detail(id), schema: permissionGroupSchema });
}

export function createPermissionGroup(values: PermissionGroupFormValues, merchantId: string): Promise<BeResult<PermissionGroup>> {
  return merchantClient().post({
    path: permissionGroupPaths.create,
    schema: permissionGroupSchema,
    body: toGroupRequest(values, merchantId),
  });
}

export function updatePermissionGroup(id: string, values: PermissionGroupFormValues): Promise<BeResult<PermissionGroup>> {
  const { merchantId, ...body } = toGroupRequest(values, "");
  void merchantId;
  return merchantClient().put({ path: permissionGroupPaths.update(id), schema: permissionGroupSchema, body });
}

export function deletePermissionGroup(id: string): Promise<BeResult<void>> {
  return merchantClient().delete({ path: permissionGroupPaths.delete(id), schema: emptySchema });
}

export function assignGroupUsers(id: string, userIds: string[]): Promise<BeResult<void>> {
  return merchantClient().post({
    path: permissionGroupPaths.assignUsers(id),
    schema: emptySchema,
    body: userIds,
  });
}

export async function listGroupUsers(id: string, page: number): Promise<BeResult<PermissionGroupPage<PermissionGroupUser>>> {
  const result = await merchantClient().get({
    path: permissionGroupPaths.users(id),
    schema: pageSchema(permissionGroupUserSchema),
    query: { page, size: 10 },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}
