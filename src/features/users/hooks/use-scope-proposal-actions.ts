"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { ScopeProposal } from "../schemas/user.schema";

const userRoot = "/v1/merchant/merchant-users";

function proposalPath(id: string, action = ""): string {
  return `${userRoot}/${encodeURIComponent(id)}/scope-proposal${action}`;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Reads, approves and rejects the scope proposal that already exists for a user. */
export function useScopeProposalActions(reportError: (message: string | undefined) => void) {
  const queryClient = useQueryClient();
  const refresh = (id: string) => queryClient.invalidateQueries({ queryKey: ["users", "scope-proposal", id] });
  const approve = useMutation({
    mutationFn: (id: string) => apiClient.post<ScopeProposal>(proposalPath(id, "/approve")),
    onSuccess: (_proposal, id) => refresh(id),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<ScopeProposal>(proposalPath(id, "/reject"), { reason }),
    onSuccess: (_proposal, { id }) => refresh(id),
  });
  const run = async (action: () => Promise<unknown>, fallback: string) => {
    reportError(undefined);
    try {
      await action();
    } catch (failure) {
      reportError(messageOf(failure, fallback));
    }
  };

  return {
    getScopeProposal: (id: string) => apiClient.get<ScopeProposal>(proposalPath(id)),
    approveScopeProposal: (id: string) => run(() => approve.mutateAsync(id), "Không duyệt được đề xuất phạm vi"),
    rejectScopeProposal: (id: string, reason: string) =>
      run(() => reject.mutateAsync({ id, reason }), "Không từ chối được đề xuất phạm vi"),
    isScopePending: approve.isPending || reject.isPending,
  };
}
