import { NextResponse } from "next/server";
import { transactionListQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import { requirePermission } from "@/server/auth/require-permission";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";
import { listTransactions } from "@/server/modules/transactions/transaction.service";

export async function GET(request: Request) {
  // Permission only, like the order list: a user assigned to Subs alone has no Master but still has a scope.
  const access = await requirePermission("VIEW_TRANSACTION");
  if (!access.ok) return access.response;
  const query = transactionListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  // BE scopes the list by the session, so no merchantId is sent.
  const result = await listTransactions(query.data);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
