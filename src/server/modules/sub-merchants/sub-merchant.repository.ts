"server-only";

import { dbQuery } from "@/lib/db/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { toSubMerchantResponse, type SubMerchantResponse } from "./sub-merchant.entity";

export interface FindAllSubMerchantParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllSubMerchants(params: FindAllSubMerchantParams): Promise<{
  data: SubMerchantResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", status = "", page = 1, pageSize = 10 } = params;
  const conditions: string[] = [];
  const args: (string | number | null)[] = [];

  if (keyword) { conditions.push("name LIKE ?"); args.push(`%${keyword}%`); }
  if (status) { conditions.push("status = ?"); args.push(status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await dbQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM sub_merchants ${where}`,
    args,
  );
  const total = Number(countRows[0]!.total);
  const offset = (page - 1) * pageSize;

  const rows = await dbQuery<RowDataPacket[]>(
    `SELECT * FROM sub_merchants ${where} ORDER BY created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
    args,
  );

  return { data: rows.map(toSubMerchantResponse), pagination: { page, pageSize, total } };
}

export async function findSubMerchantById(id: string): Promise<SubMerchantResponse | null> {
  const rows = await dbQuery<RowDataPacket[]>("SELECT * FROM sub_merchants WHERE id = ?", [id]);
  return rows.length > 0 ? toSubMerchantResponse(rows[0]!) : null;
}

type BoolField = boolean | undefined;

export async function insertSubMerchant(data: {
  id: string;
  name: string;
  businessType: string;
  contact: string;
  taxCode?: string | null;
  representative?: string | null;
  address?: string | null;
  merchantId: string;
  accessKey?: string | null;
  secretKey?: string | null;
  webhookUrl?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  notifyEnabled?: BoolField;
  notifyTxSuccess?: BoolField;
  notifyTxFailed?: BoolField;
  notifyDispute?: BoolField;
  notifyFreeze?: BoolField;
  notifyPolicyChange?: BoolField;
  notifyEmails?: string | null;
  eInvoiceEnabled?: BoolField;
  eInvoiceEmails?: string | null;
  now: Date;
}): Promise<void> {
  const b = (v: BoolField) => (v ? 1 : 0);
  await dbQuery<ResultSetHeader>(
    `INSERT INTO sub_merchants
      (id, name, business_type, contact, status, tax_code, representative, address,
       merchant_id, access_key, secret_key, webhook_url, bank_name, bank_branch,
       account_number, account_name, notify_enabled, notify_tx_success, notify_tx_failed,
       notify_dispute, notify_freeze, notify_policy_change, notify_emails,
       e_invoice_enabled, e_invoice_emails, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id, data.name, data.businessType, data.contact,
      data.taxCode ?? null, data.representative ?? null, data.address ?? null,
      data.merchantId, data.accessKey ?? null, data.secretKey ?? null, data.webhookUrl ?? null,
      data.bankName ?? null, data.bankBranch ?? null, data.accountNumber ?? null, data.accountName ?? null,
      b(data.notifyEnabled), b(data.notifyTxSuccess), b(data.notifyTxFailed),
      b(data.notifyDispute), b(data.notifyFreeze), b(data.notifyPolicyChange),
      data.notifyEmails ?? null, b(data.eInvoiceEnabled), data.eInvoiceEmails ?? null,
      data.now, data.now,
    ],
  );
}

export type UpdateSubMerchantData = Partial<Omit<SubMerchantResponse, "id" | "createdAt">>;

export async function updateSubMerchant(id: string, data: UpdateSubMerchantData): Promise<void> {
  const fieldMap: Array<[keyof UpdateSubMerchantData, string]> = [
    ["name", "name"], ["businessType", "business_type"], ["contact", "contact"],
    ["taxCode", "tax_code"], ["representative", "representative"], ["address", "address"],
    ["merchantId", "merchant_id"], ["accessKey", "access_key"], ["secretKey", "secret_key"],
    ["webhookUrl", "webhook_url"], ["bankName", "bank_name"], ["bankBranch", "bank_branch"],
    ["accountNumber", "account_number"], ["accountName", "account_name"],
    ["notifyEnabled", "notify_enabled"], ["notifyTxSuccess", "notify_tx_success"],
    ["notifyTxFailed", "notify_tx_failed"], ["notifyDispute", "notify_dispute"],
    ["notifyFreeze", "notify_freeze"], ["notifyPolicyChange", "notify_policy_change"],
    ["notifyEmails", "notify_emails"], ["eInvoiceEnabled", "e_invoice_enabled"],
    ["eInvoiceEmails", "e_invoice_emails"],
  ];

  const sets: string[] = ["updated_at = ?"];
  const values: (string | number | boolean | null | Date)[] = [new Date()];

  for (const [jsKey, dbCol] of fieldMap) {
    const val = data[jsKey];
    if (val !== undefined) {
      sets.push(`${dbCol} = ?`);
      values.push(typeof val === "boolean" ? (val ? 1 : 0) : (val as string | number | null));
    }
  }

  values.push(id);
  await dbQuery<ResultSetHeader>(`UPDATE sub_merchants SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function patchSubMerchantStatus(
  id: string,
  status: string,
  lockReason: string | null,
  lockedAt: string | null,
): Promise<void> {
  await dbQuery<ResultSetHeader>(
    "UPDATE sub_merchants SET status = ?, lock_reason = ?, locked_at = ?, updated_at = ? WHERE id = ?",
    [status, lockReason, lockedAt, new Date(), id],
  );
}

export async function deleteSubMerchant(id: string): Promise<void> {
  await dbQuery<ResultSetHeader>("DELETE FROM sub_merchants WHERE id = ?", [id]);
}

export async function subMerchantExists(id: string): Promise<boolean> {
  const rows = await dbQuery<RowDataPacket[]>(
    "SELECT id FROM sub_merchants WHERE id = ? LIMIT 1",
    [id],
  );
  return rows.length > 0;
}
