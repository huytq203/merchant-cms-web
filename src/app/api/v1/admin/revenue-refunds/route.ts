import { NextResponse } from "next/server";
import { createRefundBodySchema, refundFilterSchema } from "@/features/revenue-refunds/schemas";
import { requirePermission } from "@/server/auth/require-permission";
import { badRequest, refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { createRevenueRefund, listRevenueRefunds } from "@/server/modules/revenue-refunds/revenue-refund.service";

/** The BE scopes the list to the session's Masters and Subs, so no extra filtering happens here. */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_REFUND");
  if (!access.ok) return access.response;
  const filter = refundFilterSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!filter.success) return badRequest("Tham số không hợp lệ");
  const result = await listRevenueRefunds(filter.data);
  return result.success ? NextResponse.json({ rows: result.data }) : refundErrorResponse(result.error);
}

export async function POST(request: Request) {
  const access = await requirePermission("CREATE_REFUND");
  if (!access.ok) return access.response;
  const body = createRefundBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const result = await createRevenueRefund(body.data);
  return result.success ? NextResponse.json(result.data, { status: 201 }) : refundErrorResponse(result.error);
}
