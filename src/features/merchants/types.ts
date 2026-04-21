export type MerchantStatus = 'active' | 'pending' | 'locked' | 'inactive' | 'incomplete';
export type MerchantType = 'individual' | 'household' | 'business';

export interface MerchantDocuments {
  cccdFront: string | null;
  cccdBack: string | null;
  businessLicense: string | null;
  contract: string | null;
}

export interface Merchant {
  id: string;
  code: string;
  email: string;
  name: string | null;
  logoUrl: string | null;
  merchantType: MerchantType | null;
  businessType: string | null;
  businessTypeName: string | null;
  taxCode: string | null;
  phone: string | null;
  representativeName: string | null;
  representativePosition: string | null;
  representativeCccd: string | null;
  representativeCccdExpiry: string | null;
  representativeOtpPhone: string | null;
  address: string | null;
  emailReconciliation: string | null;
  emailInvoice: string | null;
  walletBalance: number;
  status: MerchantStatus;
  salesStaffId: string | null;
  salesStaffName: string | null;
  registeredAt: string;
  activatedAt: string | null;
  documents: MerchantDocuments;
}

export interface MerchantListFilter {
  keyword?: string;
  businessType?: string;
  registeredFrom?: Date | null;
  registeredTo?: Date | null;
  activatedFrom?: Date | null;
  activatedTo?: Date | null;
  salesStaffId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface MerchantListResponse {
  merchants: Merchant[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface SalesStaff {
  id: string;
  name: string;
  email: string;
}

export interface BusinessTypeOption {
  value: string;
  label: string;
}

export interface CreateMerchantPayload {
  email: string;
  phone: string;
  name: string;
  merchantType: MerchantType;
  taxCode?: string;
  businessType: string;
  emailReconciliation: string;
  emailInvoice: string;
  address: string;
  representativeName: string;
  representativePosition: string;
  representativeCccd: string;
  representativeCccdExpiry: string;
  representativeOtpPhone: string;
  logoUrl?: string | null;
  documents: {
    cccdFront?: File | null;
    cccdBack?: File | null;
    businessLicense?: File | null;
    contract?: File | null;
  };
}

export interface ApproveMerchantPayload {
  merchantId: string;
}

export interface RejectMerchantPayload {
  merchantId: string;
  reason: string;
  note: string;
}

export interface LockMerchantPayload {
  merchantId: string;
  reason: string;
}
