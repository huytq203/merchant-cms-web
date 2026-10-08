"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { DetailSection } from "@/components/modal/DetailModal";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { useScopeProposal } from "../hooks/use-scope-proposal";
import type { MerchantUser, ScopeProposal } from "../schemas/user.schema";
import { UserScopeItems } from "./UserScopeItems";
import { UserScopeProposalForm } from "./UserScopeProposalForm";

interface Props {
  user: MerchantUser;
  /** Every merchant id in the session. */
  merchantIds: string[];
  /** False when the actor may not change this user, for example their own account. */
  canPropose: boolean;
}

function PendingProposal({ proposal }: { proposal: ScopeProposal }) {
  return (
    <div className="space-y-1.5">
      <Badge variant="soft-warning">Đang chờ duyệt</Badge>
      <p className="text-sm">{proposal.requestReason}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        Đề xuất: {proposal.subMerchantIds.length} sub-merchant. Một người khác cần duyệt trước khi phạm vi đổi.
      </p>
    </div>
  );
}

/** Scope summary plus the entry point to request a change; saving the form never edits scope directly. */
export function UserScopeSection({ user, merchantIds, canPropose }: Props) {
  const proposal = useScopeProposal(user.id);
  const [isOpen, setIsOpen] = useState(false);
  const pending = proposal.data?.status === "PENDING_APPROVAL" ? proposal.data : null;

  return (
    <DetailSection title="Phạm vi truy cập" icon={<Store className="h-4 w-4" />} bare>
      <div className="space-y-3 rounded-xl border border-divider bg-page p-4">
        <UserScopeItems user={user} merchantIds={merchantIds} />
        {pending ? <PendingProposal proposal={pending} /> : null}
        {!pending && canPropose && !isOpen ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Đổi phạm vi cần người khác duyệt.</p>
            <Button type="button" variant="outline" size="sm" aria-expanded={false} onClick={() => setIsOpen(true)}>
              Đề xuất đổi phạm vi
            </Button>
          </div>
        ) : null}
        {!pending && canPropose && isOpen ? <UserScopeProposalForm user={user} onDone={() => setIsOpen(false)} /> : null}
      </div>
    </DetailSection>
  );
}
