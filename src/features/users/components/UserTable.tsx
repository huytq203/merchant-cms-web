"use client";

import { useMemo } from "react";
import { Table } from "@/components/ui/table/Table";
import { usePermissionGroups } from "@/features/permission/permission-group-queries";
import type { MerchantUser } from "../schemas/user.schema";
import { buildUserColumns } from "../columns/UserColumn";
import { groupNames } from "../utils/user-mapper";

interface Props {
  rows: MerchantUser[];
  total: number;
  page: number;
  pageSize: number;
  actorId: string;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (user: MerchantUser) => void;
  onEdit: (user: MerchantUser) => void;
  onLock: (user: MerchantUser) => void;
  onUnlock: (user: MerchantUser) => void;
  onReset: (user: MerchantUser) => void;
}

export function UserTable({ rows, total, page, pageSize, actorId, onPageChange, onView, onEdit, onLock, onUnlock, onReset }: Props) {
  const groups = usePermissionGroups({ page: 1, pageSize: 100 });
  const groupRows = groups.data?.rows;
  const columns = useMemo(
    () => buildUserColumns({
      actorId,
      groupNamesOf: (groupIds) => groupNames(groupIds, groupRows ?? []),
      onView,
      onEdit,
      onLock,
      onUnlock,
      onReset,
    }, page, pageSize),
    [actorId, groupRows, onView, onEdit, onLock, onUnlock, onReset, page, pageSize],
  );
  return (
    <Table
      data={rows}
      columns={columns}
      enableSorting={false}
      framed={true}
      labels={{ empty: "Chưa có người dùng", page: "Trang", perPage: " / trang" }}
      pagination={{
        total,
        current: page,
        pageSize,
        pageSizeOptions: [10, 20, 50],
        showTotal: (count) => `${count} người dùng`,
        onChange: onPageChange,
      }}
    />
  );
}
