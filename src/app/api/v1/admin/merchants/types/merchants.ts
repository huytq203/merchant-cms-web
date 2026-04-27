export interface SubMerchant {
  id: string;
  name: string;
  businessType: string;
  contact: string;
  status: "active" | "inactive";
  createdAt: string;
  taxCode: string;
  representative: string;
  address: string;
  merchantId: string;
  accessKey: string;
  secretKey: string;
  webhookUrl: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  accountName: string;
  notifyEnabled: boolean;
  notifyTxSuccess: boolean;
  notifyTxFailed: boolean;
  notifyDispute: boolean;
  notifyFreeze: boolean;
  notifyPolicyChange: boolean;
  notifyEmails: string;
  eInvoiceEnabled: boolean;
  eInvoiceEmails: string;
}
