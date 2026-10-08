'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { DetailSection } from '@/components/modal/DetailModal';
import { Button } from '@/components/ui/button/Button';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { useListGroupUsers } from '../permission-group-queries';
import { getInitials } from '../utils/permission-coverage';

const PREVIEW_COUNT = 5;
const PAGE_SIZE = 10;

type GroupUsersQuery = ReturnType<typeof useListGroupUsers>;

function EmptyUsers() {
  return (
    <div className="grid justify-items-center gap-1 rounded-xl border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
      <Users className="h-5 w-5 text-primary" aria-hidden="true" />
      <p className="font-semibold text-foreground">Chưa có người dùng trong nhóm</p>
      <p>Gán nhóm này cho người dùng ở màn Người dùng.</p>
    </div>
  );
}

function UserList({ users }: { users: { id: string; fullName: string; email: string }[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {users.map((user) => (
        <li key={user.id} className="flex items-center gap-2.5 px-3 py-2">
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-brand-ink">
            {getInitials(user.fullName)}
          </span>
          <span className="min-w-0 text-sm">
            <span className="block truncate font-medium text-foreground">{user.fullName}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

interface PagerProps {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}

function UserPager({ page, total, onPageChange }: PagerProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button type="button" variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Trang trước
      </Button>
      <span className="text-sm tabular-nums">{page}</span>
      <Button type="button" variant="outline" disabled={page * PAGE_SIZE >= total} onClick={() => onPageChange(page + 1)}>
        Trang sau
      </Button>
    </div>
  );
}

function UserResults({ users, page, onPageChange }: { users: GroupUsersQuery; page: number; onPageChange: (page: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (users.isPending) return <Skeleton className="h-16 w-full" rounded="lg" />;
  if (users.isError) {
    return (
      <div className="flex items-center gap-3">
        <p role="alert" className="text-sm text-danger">{users.error.message}</p>
        <Button type="button" variant="outline" onClick={() => void users.refetch()}>Thử lại</Button>
      </div>
    );
  }
  const { rows, total } = users.data;
  if (rows.length === 0) return <EmptyUsers />;
  const visible = expanded ? rows : rows.slice(0, PREVIEW_COUNT);
  const hiddenCount = total - PREVIEW_COUNT;

  return (
    <div className="space-y-2">
      <UserList users={visible} />
      {!expanded && hiddenCount > 0 ? (
        <Button type="button" variant="ghost" onClick={() => setExpanded(true)}>{`Xem thêm ${hiddenCount} người`}</Button>
      ) : null}
      {expanded && total > PAGE_SIZE ? <UserPager page={page} total={total} onPageChange={onPageChange} /> : null}
    </div>
  );
}

export function PermissionGroupUsersSection({ groupId }: { groupId: string }) {
  const [page, setPage] = useState(1);
  const users = useListGroupUsers(groupId, page);
  const total = users.data?.total ?? 0;
  return (
    <DetailSection title="Người dùng trong nhóm" icon={<Users className="h-4 w-4" />} aside={total > 0 ? `${total} người` : undefined}>
      <UserResults users={users} page={page} onPageChange={setPage} />
    </DetailSection>
  );
}
