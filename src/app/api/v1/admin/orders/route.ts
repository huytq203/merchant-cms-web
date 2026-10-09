import { NextResponse } from "next/server";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { z } from "zod";
import { orderFormSchema, orderStatusSchema } from "@/features/orders/schemas/order.schema";
import { createOrder, listOrders } from "@/server/modules/orders/order.service";
import {
  beErrorResponse,
  requireOrderAccess,
  requireSubMerchantScope,
  resolveMerchantId,
} from "@/server/modules/orders/require-order-access";

const listQuerySchema = paginationQuerySchema.extend({
  orderCode: z.string().trim().max(100).optional(),
  status: orderStatusSchema.optional(),
  subMerchantId: z.uuid().optional(),
  createdFrom: z.iso.date().optional(),
  createdTo: z.iso.date().optional(),
});

export async function GET(request: Request) {
  const access = await requireOrderAccess("VIEW_ORDER");
  if (!access.ok) return access.response;
  const query = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  // BE scopes the list by the session, so no merchantId is sent.
  const result = await listOrders(query.data);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}

export async function POST(request: Request) {
  const access = await requireOrderAccess("CREATE_ORDER");
  if (!access.ok) return access.response;
  const body = orderFormSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    const message = body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    return NextResponse.json({ message }, { status: 400 });
  }
  const merchantId = resolveMerchantId(access.user);
  if (merchantId instanceof NextResponse) return merchantId;
  const denied = requireSubMerchantScope(access.user, body.data.subMerchantId);
  if (denied) return denied;
  const result = await createOrder(body.data, merchantId);
  return result.success ? NextResponse.json(result.data, { status: 201 }) : beErrorResponse(result.error);
}
