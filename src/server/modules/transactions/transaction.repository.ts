"server-only";

import { dbQuery } from "@/lib/db/db";
import type { RowDataPacket } from "mysql2/promise";

export interface FindTransactionParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllTransactions(params: FindTransactionParams): Promise<{
  data: RowDataPacket[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", status = "", page = 1, pageSize = 10 } = params;
  const conditions: string[] = [];
  const args: (string | number | null)[] = [];

  if (keyword) {
    conditions.push("(code LIKE ? OR customer_name LIKE ?)");
    args.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) { conditions.push("status = ?"); args.push(status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await dbQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM transactions ${where}`,
    args,
  );
  const total = Number(countRows[0]!.total);
  const offset = (page - 1) * pageSize;

  const data = await dbQuery<RowDataPacket[]>(
    `SELECT id, code, card_type AS cardType, card_number AS cardNumber,
            card_holder_name AS cardHolderName, amount, currency, fee,
            net_amount AS netAmount, sub_merchant_id AS subMerchantId,
            sub_merchant_name AS subMerchantName, customer_id AS customerId,
            customer_name AS customerName, customer_phone AS customerPhone,
            created_at AS createdAt, status, description,
            reference_code AS referenceCode, payment_method AS paymentMethod,
            bank_code AS bankCode, response_code AS responseCode,
            response_message AS responseMessage
     FROM transactions
     ${where}
     ORDER BY created_at DESC
     LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
    args,
  );

  return { data, pagination: { page, pageSize, total } };
}
