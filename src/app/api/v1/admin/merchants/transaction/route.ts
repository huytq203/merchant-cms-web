import { NextResponse } from "next/server";
import { transactionListQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import { moduleErrorResponse, requireModuleAccess } from "@/server/modules/sample-data/require-module-access";
import { listTransactions } from "@/server/modules/transactions/transaction.service";

export async function GET(request: Request) {
  const access = await requireModuleAccess("VIEW_TRANSACTION");
  if (!access.ok) return access.response;
  const query = transactionListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const result = await listTransactions({ ...query.data, merchantId: access.merchantId });
  return result.success ? NextResponse.json(result.data) : moduleErrorResponse(result.error);
}
