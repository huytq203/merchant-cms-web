import { apiClient } from "@/lib/http/api-client";
import type { ComplaintListResponse } from "../../features/complaints/types/types";

export interface GetComplaintListParams {
  [key: string]: string | number | undefined;
  keyword?: string;
  status?: string;
  source?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export const complaintApi = {
  getList: (params: GetComplaintListParams) =>
    apiClient.get<ComplaintListResponse>("/v1/admin/merchants/complaints", {
      query: params,
    }),
};
