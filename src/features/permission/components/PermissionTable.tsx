'use client';
import { usePermissionQuery } from '@/features/permission/hooks/use-permission-query';
import { buildPermissionColumns } from '@/features/permission/columns/Permission.column';
import { Table } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { PermissionData } from '../types/type';

const PermissionTable = () => {
  const router = useRouter();
  const { data: permissionData, isLoading } = usePermissionQuery({});

  const columns = useMemo(
    () =>
      buildPermissionColumns((item: PermissionData) => {
        router.push(`/permissions/${item.id}`);
      }),
    [router],
  );

  return (
    <div>
      <Table
        columns={columns}
        data={permissionData?.data ?? []}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PermissionTable;
