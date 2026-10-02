"use client";
import { Table, Text } from "@/components/ui";
import React from "react";
import { useUserQuery } from "../hooks/use-user-query";
import usePagination from "@/hooks/usePagination";
import { useUserColumns } from "../columns/User.column";
import { UserFilterValues } from "./UserFilter";

interface UserTableProps {
  filter: UserFilterValues;
}

const UserTable = ({ filter }: UserTableProps) => {
  const { params, page, pageSize, setPage, setPageSize } = usePagination();
  const columns = useUserColumns();

  const { data: dataUser, isLoading } = useUserQuery({
    ...params,
    name: filter.name || undefined,
    status: filter.status || undefined,
    permissionGroupId: filter.permissionGroupId || undefined,
  });

  return (
    <div className="space-y-3">
      <Text className="text-sm font-medium" as={"p"}>
        Tổng số nhân viên: {dataUser?.pagination.total || 0}
      </Text>
      <Table
        columns={columns}
        data={dataUser?.data || []}
        isLoading={isLoading}
        labels={{ empty: 'Không tìm thấy nhân viên nào phù hợp' }}
        pagination={
          dataUser?.pagination.total !== undefined
            ? {
                total: dataUser.pagination.total,
                current: page,
                pageSize,
                pageSizeOptions: [10, 20, 50],
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              }
            : false
        }
      />
    </div>
  );
};

export default UserTable;
