export type SubMerchantStatus = "active" | "inactive" | "locked";

export interface SubMerchant {
  id: string;
  name: string;
  businessType: string;
  contact: string;
  status: SubMerchantStatus;
  createdAt: string;
  // Thông tin pháp lý
  taxCode?: string;
  representative?: string;
  address?: string;
  // Key kết nối
  merchantId?: string;
  accessKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  // Tài khoản ngân hàng
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  accountName?: string;
  // Cấu hình thông báo
  notifyEnabled?: boolean;
  notifyTxSuccess?: boolean;
  notifyTxFailed?: boolean;
  notifyDispute?: boolean;
  notifyFreeze?: boolean;
  notifyPolicyChange?: boolean;
  notifyEmails?: string;
  // Hóa đơn điện tử
  eInvoiceEnabled?: boolean;
  eInvoiceEmails?: string;
  // Thông tin khóa
  reason?: string;
  lockedBy?: string;
  lockedAt?: string;
}

export interface SubMerchantListFilter {
  keyword?: string;
  status?: SubMerchantStatus | string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface SubMerchantListResponse {
  data: SubMerchant[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
