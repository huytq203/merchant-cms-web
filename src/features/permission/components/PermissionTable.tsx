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

const PermissionTable = () => {
  const router = useRouter();
  const { data: permissionData, isLoading } = usePermissionQuery({});

  const form = useForm({
    defaultValues: {
      keyword: "",
    },
  });

  const watched = useWatch({ control: form.control });
  const debouncedKeyword = useDebounce(watched.keyword ?? "", 400);

   const filteredData = useMemo(() => {
    if (!debouncedKeyword) return permissionData?.data ?? [];

    return (permissionData?.data ?? []).filter((item) =>
      item.name?.toLowerCase().includes(debouncedKeyword.toLowerCase()) 
    );
  }, [debouncedKeyword, permissionData]);

  const columns = useMemo(
    () =>
      buildPermissionColumns((item: PermissionData) => {
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
              value={field.value ?? ''}
            />
          )}
        />
      </Form>

      <Table
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PermissionTable;
