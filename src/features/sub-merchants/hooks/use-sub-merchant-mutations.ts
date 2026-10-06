import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/http/api-client';
import type { SubMerchantFormValues } from '../schemas';
import type { SubMerchantDetail } from '../types';
import { subMerchantQueries } from '../sub-merchant-queries';

function useSubMerchantMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<SubMerchantDetail>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (detail) => {
      client.setQueryData(subMerchantQueries.detail(detail.id).queryKey, detail);
      void client.invalidateQueries({ queryKey: ['sub-merchants'] });
    },
  });
}

export function useLockSubMerchant() {
  return useSubMerchantMutation(({ id, reason }: { id: string; reason: string }) =>
    apiClient.post<SubMerchantDetail>(`/v1/admin/sub-merchants/${id}/lock`, { reason }),
  );
}

export function useUnlockSubMerchant() {
  return useSubMerchantMutation(({ id, reason }: { id: string; reason: string }) =>
    apiClient.post<SubMerchantDetail>(`/v1/admin/sub-merchants/${id}/unlock`, { reason }),
  );
}

export function useSaveSubMerchant(id?: string) {
  return useSubMerchantMutation((values: SubMerchantFormValues) => id
    ? apiClient.put<SubMerchantDetail>(`/v1/admin/sub-merchants/${id}`, values)
    : apiClient.post<SubMerchantDetail>('/v1/admin/sub-merchants', values),
  );
}
