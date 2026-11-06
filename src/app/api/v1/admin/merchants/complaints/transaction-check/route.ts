import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/require-permission";
import { checkTransaction } from "@/server/modules/complaints/complaint.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

const querySchema = z.object({
  transactionCode: z.string("Vui lòng nhập mã giao dịch").trim().min(1, "Vui lòng nhập mã giao dịch").max(100, "Mã giao dịch không hợp lệ"),
});

/** Same permission as creating a complaint: the check only exists to feed that form. */
export async function GET(request: Request) {
  const access = await requirePermission("CREATE_DISPUTE");
  if (!access.ok) return access.response;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: query.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  const result = await checkTransaction(query.data.transactionCode);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
