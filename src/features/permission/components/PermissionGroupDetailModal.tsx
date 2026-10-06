'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog/Dialog';
import { Button } from '@/components/ui/button/Button';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { permissionLabel } from '../constants/permission-labels';
import { useListGroupUsers } from '../permission-group-queries';
import type { PermissionGroup } from '../schemas/permission-group.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: PermissionGroup | null;
}

function GroupUserList({ users }: { users: ReturnType<typeof useListGroupUsers> }) {
  if (users.isPending) return <Skeleton className="h-16 w-full" />;
  if (users.isError) return <p role="alert">{users.error.message}</p>;
  if (users.data.rows.length === 0) return <p>Chưa có người dùng trong nhóm.</p>;
  return (
    <ul className="space-y-2">
      {users.data.rows.map((user) => (
        <li key={user.id} className="rounded-lg border border-border p-3">
          <span className="font-medium">{user.fullName}</span>
          <span className="ml-2 text-muted-foreground">{user.email}</span>
        </li>
      ))}
    </ul>
  );
}

function GroupUsers({ groupId }: { groupId: string }) {
  const [page, setPage] = useState(1);
  const users = useListGroupUsers(groupId, page);
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Người dùng trong nhóm</h3>
      <GroupUserList users={users} />
      {users.data && users.data.total > 10 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trang trước
          </Button>
          <span>{page}</span>
          <Button
            type="button"
            variant="outline"
            disabled={page * 10 >= users.data.total}
            onClick={() => setPage(page + 1)}
          >
            Trang sau
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function GroupInfo({ group }: { group: PermissionGroup }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <Field label="Mã nhóm">{group.code}</Field>
      <Field label="Tên nhóm">{group.name}</Field>
      <Field label="Mô tả" wide>{group.description || 'Không có mô tả'}</Field>
      <Field label="Quyền" wide>{group.permissions.map(permissionLabel).join(', ')}</Field>
    </dl>
  );
}

export function PermissionGroupDetailModal({ open, onOpenChange, group }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết nhóm quyền</DialogTitle>
        </DialogHeader>
        {group ? (
          <div className="space-y-4">
            <GroupInfo group={group} />
            <GroupUsers key={group.id} groupId={group.id} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
