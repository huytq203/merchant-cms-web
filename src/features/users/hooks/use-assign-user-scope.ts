"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/api-client";
import type { ScopeAssignmentResult } from "../schemas/user.schema";

export type ScopeAxis = "merchants" | "sub-merchants";

/** The BE message is English, and narrowing and widening mean different things, so the text follows the outcome. */
export function scopeAssignmentMessage(result: Pick<ScopeAssignmentResult, "status">): string {
  return result.status === "APPROVED"
    ? "Đã thu hẹp phạm vi, có hiệu lực ngay"
    : "Đã gửi đề xuất đổi phạm vi, chờ người khác duyệt";
}

/**
 * Replaces one scope axis with the full target list. Widening (or a mixed add and remove) only creates a pending
 * proposal; the old scope stays in force until a second person approves. The "merchants" axis is for owners of the
 * merchant: a Sub-level manager must use "sub-merchants".
 */
export function useAssignUserScope() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, axis, ids }: { id: string; axis: ScopeAxis; ids: string[] }) =>
      apiClient.put<ScopeAssignmentResult>(`/v1/merchant/merchant-users/${encodeURIComponent(id)}/${axis}`, { ids }, { toast: false }),
    onSuccess: (result, { id }) => {
      toast.success(scopeAssignmentMessage(result));
      void client.invalidateQueries({ queryKey: ["users", "list"] });
      return client.invalidateQueries({ queryKey: ["users", "scope-proposal", id] });
    },
  });
}
