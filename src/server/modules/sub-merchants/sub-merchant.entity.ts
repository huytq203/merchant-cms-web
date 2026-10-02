"server-only";

import type { SubMerchant as PrismaSubMerchant } from "@prisma/client";
import type { SubMerchant } from "@/app/api/v1/admin/merchants/types/Merchants";

export type { SubMerchant as SubMerchantResponse };

export function toSubMerchantResponse(sm: PrismaSubMerchant): SubMerchant {
  return {
    id: sm.id,
    name: sm.name,
    businessType: sm.businessType,
    contact: sm.contact,
    status: sm.status as SubMerchant["status"],
    createdAt: sm.createdAt.toISOString(),
    taxCode: sm.taxCode ?? "",
    representative: sm.representative ?? "",
    address: sm.address ?? "",
    merchantId: sm.merchantId ?? "",
    accessKey: sm.accessKey ?? "",
    secretKey: sm.secretKey ?? "",
    webhookUrl: sm.webhookUrl ?? "",
    bankName: sm.bankName ?? "",
    bankBranch: sm.bankBranch ?? "",
    accountNumber: sm.accountNumber ?? "",
    accountName: sm.accountName ?? "",
    notifyEnabled: sm.notifyEnabled,
    notifyTxSuccess: sm.notifyTxSuccess,
    notifyTxFailed: sm.notifyTxFailed,
    notifyDispute: sm.notifyDispute,
    notifyFreeze: sm.notifyFreeze,
    notifyPolicyChange: sm.notifyPolicyChange,
    notifyEmails: sm.notifyEmails ?? "",
    eInvoiceEnabled: sm.eInvoiceEnabled,
    eInvoiceEmails: sm.eInvoiceEmails ?? "",
    lockReason: sm.lockReason ?? null,
    lockedAt: sm.lockedAt ? sm.lockedAt.toISOString() : null,
  };
}
