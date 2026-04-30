import { apiClient } from "@/lib/http/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubMerchant } from "../types";
import type {
  NewSubMerchantFormValues,
  SubMerchantFormValues,
} from "../schemas";
import { subMerchantApi } from "../../../lib/api/SubMerchant";

export const useCreateSubMerchant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubMerchantFormValues) =>
      subMerchantApi.postCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-merchants"] });
    },
  });
};

export const useUpdateSubMerchant = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubMerchantFormValues) =>
      subMerchantApi.putUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-merchants"] });
    },
  });
};

export const useCreateSubMerchantFull = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: NewSubMerchantFormValues & {
        merchantId: string;
        accessKey: string;
        secretKey: string;
      },
    ) => subMerchantApi.postCreateFull(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-merchants"] });
    },
  });
};

export const useUpdateSubMerchantFull = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: NewSubMerchantFormValues & {
        merchantId: string;
        accessKey: string;
        secretKey: string;
      },
    ) => subMerchantApi.putUpdateFull(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-merchants"] });
      queryClient.invalidateQueries({ queryKey: ["sub-merchant", id] });
    },
  });
};

export const useToggleSubMerchantStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      lockReason,
      lockedAt,
    }: {
      id: string;
      lockReason: string | null;
      lockedAt: string | null;
    }) => subMerchantApi.toggleStatus(id, { lockReason, lockedAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-merchants"] });
    },
  });
};

export const useDeleteSubMerchant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/v1/admin/merchants/sub-merchants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-merchants"] });
    },
  });
};
