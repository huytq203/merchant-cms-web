import { useQuery } from "@tanstack/react-query";
import {
  refundApi,
  type GetRefundListParams,
} from "../../../lib/api/refund.api";
import { RefundListResponse } from "../types/type";

export function useRefundsQuery(params: GetRefundListParams = {}) {
  const finalParams = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    ...params,
  };
  return useQuery<RefundListResponse>({
    queryKey: ["refunds", finalParams],
    queryFn: () => refundApi.getList(finalParams),
    staleTime: 1000 * 60,
  });
}
