import { apiClient } from '@/lib/http/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubMerchant } from '../types';
import type { SubMerchantFormValues } from '../schemas';

export const useCreateSubMerchant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubMerchantFormValues) =>
      apiClient.post<SubMerchant>('/v1/admin/merchants/sub-merchants', { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-merchants'] });
    },
  });
};

export const useUpdateSubMerchant = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubMerchantFormValues) =>
      apiClient.put<SubMerchant>(`/v1/admin/merchants/sub-merchants/${id}`, { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-merchants'] });
    },
  });
};

export const useDeleteSubMerchant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/v1/admin/merchants/sub-merchants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-merchants'] });
    },
  });
};
