export type SubMerchantStatus = 'active' | 'inactive' | 'locked';

export interface SubMerchant {
  id: string;
  name: string;
  businessType: string;
  contact: string;
  status: SubMerchantStatus;
  createdAt: string;
}

export interface SubMerchantListFilter {
  keyword?: string;
  status?: SubMerchantStatus | string;
  page?: number;
  pageSize?: number;
}

export interface SubMerchantListResponse {
  data: SubMerchant[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
