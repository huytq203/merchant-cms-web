"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiClient } from "@/lib/http/api-client";
import type { ScopeChangeResult, ScopeProposal, ScopeProposalFormValues } from "../schemas/user.schema";

const root = "/v1/merchant/merchant-users";

function itemPath(id: string, action: string): string {
  return `${root}/${encodeURIComponent(id)}/${action}`;
}

/** A user without a proposal answers 404, which means "none", not a failure. */
async function fetchScopeProposal(id: string): Promise<ScopeProposal | null> {
  try {
    return await apiClient.get<ScopeProposal>(itemPath(id, "scope-proposal"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function useScopeProposal(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["users", "scope-proposal", userId],
    queryFn: () => fetchScopeProposal(userId ?? ""),
    enabled: enabled && Boolean(userId),
    retry: false,
  });
}

export function useCreateScopeProposal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ScopeProposalFormValues }) =>
      apiClient.post<ScopeChangeResult>(itemPath(id, "scope-proposals"), values, { toast: false }),
    onSuccess: (created, { id }) => {
      // The BE message is English, and narrowing and adding mean different things to the user, so the text is chosen here.
      toast.success(created.status === "APPROVED"
        ? "Đã thu hẹp phạm vi, có hiệu lực ngay"
        : "Đã gửi đề xuất đổi phạm vi, chờ duyệt");
      void client.invalidateQueries({ queryKey: ["users", "list"] });
      return client.invalidateQueries({ queryKey: ["users", "scope-proposal", id] });
    },
  });
}
