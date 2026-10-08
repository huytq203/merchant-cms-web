"use client";

import { useState } from "react";
import { FileClock } from "lucide-react";
import { DetailSection } from "@/components/modal/DetailModal";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { proposalStatusLabels } from "../constants/user.constants";
import type { ScopeProposal } from "../schemas/user.schema";

interface Props {
  proposal: ScopeProposal | null;
  error?: string;
  isPending: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

const statusVariant = { PENDING_APPROVAL: "soft-warning", APPROVED: "soft-success", REJECTED: "soft-danger" } as const;

function ReviewControls({ isPending, onApprove, onReject }: Pick<Props, "isPending" | "onApprove" | "onReject">) {
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-3">
      <Input
        label="Lý do từ chối"
        placeholder="Nhập lý do nếu từ chối đề xuất"
        value={reason}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={!reason.trim() || isPending} onClick={() => onReject(reason.trim())}>
          Từ chối đề xuất
        </Button>
        <Button type="button" variant="solid" disabled={isPending} onClick={onApprove}>
          Duyệt đề xuất
        </Button>
      </div>
    </div>
  );
}

function ProposalBody({ proposal, isPending, onApprove, onReject }: Omit<Props, "error"> & { proposal: ScopeProposal }) {
  return (
    <div className="space-y-2">
      <Badge variant={statusVariant[proposal.status]}>{proposalStatusLabels[proposal.status]}</Badge>
      <p className="text-sm">{proposal.requestReason}</p>
      <p className="text-sm text-muted-foreground">
        Phạm vi đề xuất: {proposal.merchantIds.length} merchant, {proposal.subMerchantIds.length} sub-merchant.
      </p>
      {proposal.decisionReason ? <p className="text-sm text-muted-foreground">{proposal.decisionReason}</p> : null}
      {proposal.status === "PENDING_APPROVAL" ? (
        <ReviewControls isPending={isPending} onApprove={onApprove} onReject={onReject} />
      ) : null}
    </div>
  );
}

/** Rendered only when the user has a scope proposal or loading it failed. */
export function UserScopeProposalSection({ proposal, error, isPending, onApprove, onReject }: Props) {
  if (!proposal && !error) return null;

  return (
    <DetailSection title="Đề xuất phạm vi" icon={<FileClock className="h-4 w-4" />}>
      <div role="region" aria-label="Đề xuất phạm vi" className="space-y-2">
        {proposal ? (
          <ProposalBody proposal={proposal} isPending={isPending} onApprove={onApprove} onReject={onReject} />
        ) : null}
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      </div>
    </DetailSection>
  );
}
