"use client";

import { Mail, ShieldCheck, Store } from "lucide-react";
import { DetailItem, DetailList, DetailModal, DetailSection, StatusBadge } from "@/components/modal/DetailModal";
import type { SessionMerchant } from "@/types/auth";
import { usePermissionGroups } from "@/features/permission/permission-group-queries";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import { userStatusLabels } from "../constants/user.constants";
import type { MerchantUser, ScopeProposal } from "../schemas/user.schema";
import { formatCreatedAt } from "../utils/user-format";
import { groupNames } from "../utils/user-mapper";
import { getInitials } from "../utils/user-restrictions";
import { labelOf, nameOf, userStatusOf } from "../utils/user-view";
import { UserGroupChips } from "./UserGroupChips";
import { UserQuickActions } from "./UserQuickActions";
import { UserScopeItems } from "./UserScopeItems";
import { UserScopeProposalSection } from "./UserScopeProposalSection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  actorId: string;
  merchants?: SessionMerchant[];
  proposal: ScopeProposal | null;
  proposalError?: string;
  isPending: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onReset: () => void;
  onToggleLock: () => void;
  /** Omitted when the viewer may not edit; the Edit button then disappears. */
  onEdit?: () => void;
}

const statusTone = { PENDING: "warning", ACTIVE: "success", LOCKED: "danger" } as const;

function GroupsSection({ user }: { user: MerchantUser }) {
  const groups = usePermissionGroups({ page: 1, pageSize: 100 });
  const names = groupNames(user.groups, groups.data?.rows ?? []);

  return (
    <DetailSection title="Nhóm quyền" icon={<ShieldCheck className="h-4 w-4" />} aside={`${user.groups.length} nhóm`}>
      {user.groups.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có nhóm quyền</p> : <UserGroupChips names={names} />}
    </DetailSection>
  );
}

function Sections({ user, ...props }: Omit<Props, "open" | "onOpenChange" | "onEdit" | "user"> & { user: MerchantUser }) {
  return (
    <>
      <UserQuickActions user={user} actorId={props.actorId} onReset={props.onReset} onToggleLock={props.onToggleLock} />
      <DetailSection title="Thông tin liên hệ" icon={<Mail className="h-4 w-4" />}>
        <DetailList>
          <DetailItem label="Email">{user.email}</DetailItem>
          <DetailItem label="Số điện thoại">
            {user.phone ? <span className="tabular-nums">{user.phone}</span> : <span className="text-muted-foreground">Chưa có</span>}
          </DetailItem>
        </DetailList>
      </DetailSection>
      <GroupsSection user={user} />
      <DetailSection title="Phạm vi truy cập" icon={<Store className="h-4 w-4" />}>
        <UserScopeItems user={user} merchants={props.merchants} />
      </DetailSection>
      <UserScopeProposalSection
        proposal={props.proposal}
        error={props.proposalError}
        isPending={props.isPending}
        onApprove={props.onApprove}
        onReject={props.onReject}
      />
    </>
  );
}

export function UserDetailModal({ open, onOpenChange, user, onEdit, ...sectionProps }: Props) {
  const shown = usePreservedValue(user);
  if (!shown) return null;
  const status = userStatusOf(shown);

  return (
    <DetailModal
      open={open}
      onOpenChange={onOpenChange}
      header={{
        monogramInitials: getInitials(labelOf(shown)),
        title: labelOf(shown),
        statusBadge: (
          <span className="flex flex-wrap items-center gap-2">
            {nameOf(shown) ? <span className="text-sm text-muted-foreground">{shown.email}</span> : null}
            <StatusBadge tone={statusTone[status]}>{userStatusLabels[status]}</StatusBadge>
          </span>
        ),
      }}
      sections={<Sections user={shown} {...sectionProps} />}
      createdAt={formatCreatedAt(shown.createdAt)}
      editLabel="Sửa"
      onEdit={onEdit}
    />
  );
}
