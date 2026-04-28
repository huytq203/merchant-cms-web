"server-only";

import type { RowDataPacket } from "mysql2/promise";
import type { SubMerchant } from "@/app/api/v1/admin/merchants/types/merchants";

export type { SubMerchant as SubMerchantResponse };

export function toSubMerchantResponse(row: RowDataPacket): SubMerchant {
  return {
    id: row.id as string,
    name: row.name as string,
    businessType: row.business_type as string,
    contact: row.contact as string,
    status: row.status as SubMerchant["status"],
    createdAt: String(row.created_at),
    taxCode: (row.tax_code ?? "") as string,
    representative: (row.representative ?? "") as string,
    address: (row.address ?? "") as string,
    merchantId: (row.merchant_id ?? "") as string,
    accessKey: (row.access_key ?? "") as string,
    secretKey: (row.secret_key ?? "") as string,
    webhookUrl: (row.webhook_url ?? "") as string,
    bankName: (row.bank_name ?? "") as string,
    bankBranch: (row.bank_branch ?? "") as string,
    accountNumber: (row.account_number ?? "") as string,
    accountName: (row.account_name ?? "") as string,
    notifyEnabled: Boolean(row.notify_enabled),
    notifyTxSuccess: Boolean(row.notify_tx_success),
    notifyTxFailed: Boolean(row.notify_tx_failed),
    notifyDispute: Boolean(row.notify_dispute),
    notifyFreeze: Boolean(row.notify_freeze),
    notifyPolicyChange: Boolean(row.notify_policy_change),
    notifyEmails: (row.notify_emails ?? "") as string,
    eInvoiceEnabled: Boolean(row.e_invoice_enabled),
    eInvoiceEmails: (row.e_invoice_emails ?? "") as string,
    lockReason: (row.lock_reason as string | null) ?? null,
    lockedAt: row.locked_at ? String(row.locked_at) : null,
  };
}
