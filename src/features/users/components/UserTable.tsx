"use client"
import { Table, Text } from "@/components/ui";
import React from "react";
import { useUserQuery } from "../hooks/use-user-query";
import usePagination from "@/hooks/usePagination";
import { useUserColumns } from "../columns/User.column";

const UserTable = () => {
  const { params } = usePagination();
  const { data: dataUser, isLoading: isLoadingUser } = useUserQuery(params);
  const columns = useUserColumns();
  return (
    <div className="space-y-3">
      <Text className="text-sm font-medium" as={"p"}>
        Tổng số nhân viên: {dataUser?.pagination.total || 0}
      </Text>
      <Table columns={columns} data={dataUser?.data || []} />
    </div>
  );
};

export default UserTable;
