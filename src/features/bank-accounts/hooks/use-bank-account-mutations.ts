import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/api-client";
import { BANK_ACCOUNTS_ENDPOINT } from "../bank-account-queries";
import type { BankOtpChallenge, BankUpdateResponse, CreateBankRequest, UpdateBankRequest } from "../types";

type ReasonInput = { id: string; reason?: string };

async function refreshAccounts(client: QueryClient, id?: string): Promise<void> {
  await client.invalidateQueries({ queryKey: ["bank-accounts", "list"] });
  if (id) await client.invalidateQueries({ queryKey: ["bank-accounts", "detail", id] });
}

const appliedMessage = (result: BankUpdateResponse, done: string): string =>
  result.applied ? done : "Đã gửi yêu cầu thay đổi, tài khoản ở trạng thái Chờ duyệt";

export function useBankOtpChallenge() {
  return useMutation({
    mutationFn: (targetId?: string) =>
      apiClient.post<BankOtpChallenge>(`${BANK_ACCOUNTS_ENDPOINT}/otp-challenge`, targetId ? { targetId } : {}),
  });
}

export function useCreateBankAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateBankRequest) => apiClient.post<BankUpdateResponse>(BANK_ACCOUNTS_ENDPOINT, request),
    onSuccess: async () => {
      await refreshAccounts(client);
      toast.success("Đã gửi liên kết, tài khoản đang chờ xác minh");
    },
  });
}

export function useUpdateBankAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateBankRequest }) =>
      apiClient.put<BankUpdateResponse>(`${BANK_ACCOUNTS_ENDPOINT}/${id}`, request),
    onSuccess: async (result, { id }) => {
      await refreshAccounts(client, id);
      toast.success(appliedMessage(result, "Cập nhật tài khoản thành công"));
    },
  });
}

export function useSetDefaultBankAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: ReasonInput) =>
      apiClient.put<BankUpdateResponse>(`${BANK_ACCOUNTS_ENDPOINT}/${id}/default`, reason ? { reason } : {}),
    onSuccess: async (result, { id }) => {
      await refreshAccounts(client, id);
      toast.success(appliedMessage(result, "Đã đặt làm tài khoản mặc định"));
    },
  });
}

export function useDeleteBankAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: ReasonInput) =>
      apiClient.delete<undefined>(`${BANK_ACCOUNTS_ENDPOINT}/${id}`, { body: reason ? { reason } : undefined }),
    onSuccess: async (_result, { id }) => {
      await refreshAccounts(client);
      client.removeQueries({ queryKey: ["bank-accounts", "detail", id] });
      toast.success("Đã xoá tài khoản ngân hàng");
    },
  });
}
