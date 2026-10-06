"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Input } from "@/components/ui/input/Input";
import { usePermissionGroups } from "@/features/permission/permission-group-queries";
import { proposalStatusLabels, userStatusLabels } from "../constants/user.constants";
import type { MerchantUser, ScopeProposal } from "../schemas/user.schema";
import { groupNames } from "../utils/user-mapper";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  proposal: ScopeProposal | null;
  isProposalLoading: boolean;
  proposalError?: string;
  isPending: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function UserSummary({ user }: { user: MerchantUser }) {
  const groups = usePermissionGroups({ page: 1, pageSize: 100 });
  const names = groupNames(user.groupIds, groups.data?.rows ?? []);
  const groupText = user.groupIds.length === 0 ? "Chưa có nhóm quyền" : names.join(", ") || "—";

  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <Field label="Email">{user.email}</Field>
      <Field label="Họ và tên">{user.fullName}</Field>
      <Field label="Số điện thoại">{user.phone || "Chưa có"}</Field>
      <Field label="Trạng thái">{userStatusLabels[user.status]}</Field>
      <Field label="Nhóm quyền" wide>{groupText}</Field>
    </dl>
  );
}

function ProposalNotice({ proposal, isPending, onApprove, onReject }: {
  proposal: ScopeProposal;
  isPending: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const canReject = reason.trim().length > 0 && !isPending;
  const isPendingApproval = proposal.status === "PENDING_APPROVAL";

  return (
    <section className="space-y-2 border-t border-border pt-4" aria-label="Yêu cầu đổi phạm vi gần nhất">
      <p className="text-sm font-medium">Đề xuất đổi phạm vi</p>
      <Badge variant="soft-warning">{proposalStatusLabels[proposal.status]}</Badge>
      <p className="text-sm">{proposal.requestReason}</p>
      <p className="text-sm text-muted-foreground">
        Phạm vi đề xuất: {proposal.merchantIds.length} merchant, {proposal.subMerchantIds.length} sub-merchant.
      </p>
      {proposal.decisionReason && <p className="text-sm text-muted-foreground">{proposal.decisionReason}</p>}
      {isPendingApproval && (
        <div className="space-y-3">
          <Input
            label="Lý do từ chối"
            placeholder="Nhập lý do nếu từ chối đề xuất"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={!canReject} onClick={() => onReject(reason.trim())}>
              Từ chối đề xuất
            </Button>
            <Button type="button" variant="solid" disabled={isPending} onClick={onApprove}>
              Duyệt đề xuất
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function ProposalState({ proposal, isProposalLoading, proposalError, isPending, onApprove, onReject }: Omit<Props, "open" | "onOpenChange" | "user">) {
  if (isProposalLoading) return <p role="status" className="text-sm text-muted-foreground">Đang tải đề xuất phạm vi...</p>;
  if (proposalError) return <p role="alert" className="text-sm text-danger">{proposalError}</p>;
  if (!proposal) return <p className="text-sm text-muted-foreground">Chưa có đề xuất đổi phạm vi.</p>;
  return <ProposalNotice proposal={proposal} isPending={isPending} onApprove={onApprove} onReject={onReject} />;
}

export function UserDetailModal({ open, onOpenChange, user, proposal, isProposalLoading, proposalError, isPending, onApprove, onReject }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết người dùng</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-5">
            <UserSummary user={user} />
            <ProposalState
              proposal={proposal}
              isProposalLoading={isProposalLoading}
              proposalError={proposalError}
              isPending={isPending}
              onApprove={onApprove}
              onReject={onReject}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
