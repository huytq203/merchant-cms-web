'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { Info, ShieldCheck } from 'lucide-react';
import { Badge, DetailModal, DetailSection } from '@/components/modal/DetailModal';
import { usePreservedValue } from '@/lib/hooks/use-preserved-value';
import type { PermissionCatalogItem, PermissionGroup } from '../schemas/permission-group.schema';
import { formatGroupDate, getInitials } from '../utils/permission-coverage';
import { scopeLevelLabel } from '../utils/permission-group-mapper';
import { PermissionGroupPermissions } from './PermissionGroupPermissions';
import { PermissionGroupUsersSection } from './PermissionGroupUsers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: PermissionGroup | null;
  catalog: UseQueryResult<PermissionCatalogItem[]>;
  /** Only passed when the viewer may edit this group (merchant groups). */
  onEdit?: () => void;
}

function GroupSections({ group, catalog }: { group: PermissionGroup; catalog: Props['catalog'] }) {
  const grantedLabel = catalog.data ? `${group.permissions.length}/${catalog.data.length} quyền` : undefined;
  return (
    <>
      <DetailSection title="Tổng quan" icon={<Info className="h-4 w-4" />}>
        <p className={group.description ? 'text-sm text-muted-foreground' : 'text-sm text-muted-foreground/70'}>
          {group.description || 'Chưa có mô tả'}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Cấp quản lý: <span className="font-medium text-foreground">{scopeLevelLabel(group.scopeLevel)}</span>
        </p>
      </DetailSection>
      <DetailSection title="Quyền trong nhóm" icon={<ShieldCheck className="h-4 w-4" />} aside={grantedLabel}>
        <PermissionGroupPermissions catalog={catalog} grantedCodes={group.permissions} />
      </DetailSection>
      <PermissionGroupUsersSection key={group.id} groupId={group.id} />
    </>
  );
}

export function PermissionGroupDetailModal({ open, onOpenChange, group, catalog, onEdit }: Props) {
  const shown = usePreservedValue(group);
  if (!shown) return null;
  const created = formatGroupDate(shown.createdAt);

  return (
    <DetailModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      header={{
        monogramInitials: getInitials(shown.name),
        title: shown.name,
        code: shown.code || undefined,
        statusBadge: <Badge tone={shown.system ? 'info' : 'success'}>{shown.system ? 'Hệ thống' : 'Merchant'}</Badge>,
      }}
      sections={<GroupSections group={shown} catalog={catalog} />}
      createdAt={created ?? undefined}
      editLabel="Sửa"
      onEdit={onEdit}
    />
  );
}
