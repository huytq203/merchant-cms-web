import { useQuery } from "@tanstack/react-query";
import { subMerchantApi } from "@/lib/api/SubMerchant";

interface UseSubMerchantsParams {
  keyword?: string;
}

export const useSubMerchants = (params?: UseSubMerchantsParams) => {
  return useQuery({
    queryKey: ["sub-merchants", params],
    queryFn: () => subMerchantApi.getAll({ pageSize: 100, ...params }),
    staleTime: 1000 * 60 * 5,
  });
};
