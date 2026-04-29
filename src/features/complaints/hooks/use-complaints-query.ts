import { useQuery } from '@tanstack/react-query';
import { complaintApi, type GetComplaintListParams } from '../api/complaint.api';
import type { ComplaintListResponse } from '../types';

export function useComplaintsQuery(params: GetComplaintListParams = {}) {
  const finalParams = { page: 1, pageSize: 10, ...params };
  return useQuery<ComplaintListResponse>({
    queryKey: ['complaints', finalParams],
    queryFn: () => complaintApi.getList(finalParams),
    staleTime: 1000 * 60,
  });
}
