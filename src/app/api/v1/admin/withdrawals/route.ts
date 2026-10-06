import { NextResponse } from "next/server";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { withdrawalCreateBodySchema } from "@/features/withdrawals/schemas/withdrawal.schema";
import { createWithdrawal, listWithdrawals } from "@/server/modules/withdrawals/withdrawal.service";
import { beErrorResponse, requireWithdrawalAccess } from "@/server/modules/withdrawals/require-withdrawal-access";

// The BE search takes pagination only and scopes by the session; merchantId from the client is ignored.
const listQuerySchema = paginationQuerySchema;

export async function GET(request: Request) {
  const access = await requireWithdrawalAccess("VIEW_WITHDRAWAL");
  if (!access.ok) return access.response;
  const query = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const result = await listWithdrawals(query.data);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}

export async function POST(request: Request) {
  const access = await requireWithdrawalAccess("CREATE_WITHDRAWAL");
  if (!access.ok) return access.response;
  const body = withdrawalCreateBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    const message = body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    return NextResponse.json({ message }, { status: 400 });
  }
  const result = await createWithdrawal(body.data);
  return result.success ? NextResponse.json(result.data, { status: 201 }) : beErrorResponse(result.error);
}
