"use client";
import { usePermissionQuery } from "@/features/permission/hooks/use-permission-query";
import { buildPermissionColumns } from "@/features/permission/columns/Permission.column";
import { Form, FormField, Input, Table } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PermissionData } from "../types/type";
import { Search } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useForm, useWatch } from "react-hook-form";
import usePagination from "@/hooks/usePagination";

const PermissionTable = () => {
  const router = useRouter();
  const { page, pageSize, setPage, setPageSize, params } = usePagination();

  const form = useForm({ defaultValues: { keyword: "" } });
  const watched = useWatch({ control: form.control });
  const debouncedKeyword = useDebounce(watched.keyword ?? "", 400);

  const { data: permissionData, isLoading } = usePermissionQuery({
    ...params,
    keyword: debouncedKeyword || undefined,
  });

  const columns = useMemo(
    () =>
      buildPermissionColumns<string>((item: PermissionData<string>) => {
        router.push(`/permissions/${item.id}`);
      }),
    [router],
  );

  return (
    <div className="space-y-3">
      <Form {...form}>
        <FormField
          name="keyword"
          control={form.control}
          render={({ field }) => (
            <Input
              icon={<Search className="h-4 w-4" />}
              label="Tên nhóm quyền"
              placeholder="Nhập tên nhóm quyền..."
              {...field}
              value={field.value ?? ""}
            />
          )}
        />
      </Form>

      <Table
        columns={columns}
        data={permissionData?.data ?? []}
        isLoading={isLoading}
        labels={{ empty: "Không tìm thấy nhóm quyền nào phù hợp" }}
        pagination={
          permissionData?.pagination.total !== undefined
            ? {
                total: permissionData.pagination.total,
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

export default PermissionTable;
