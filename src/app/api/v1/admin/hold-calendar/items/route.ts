import { NextResponse } from "next/server";
import { z } from "zod";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { requirePermission } from "@/server/auth/require-permission";
import { listHoldItems } from "@/server/modules/hold-calendar/hold-calendar.service";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

const querySchema = paginationQuerySchema
  .extend({
    subMerchantId: z.uuid("Sub-merchant không hợp lệ").optional(),
    state: z.enum(["HOLDING", "RELEASED", "RELEASED_EARLY", "CANCELLED_BY_REFUND", "ALL"]).default("HOLDING"),
    from: day.optional(),
    to: day.optional(),
  })
  .refine((value) => !value.from || !value.to || value.to >= value.from, { message: "Ngày kết thúc không được trước ngày bắt đầu", path: ["to"] });

/** Danh sách từng khoản tạm giữ của màn Lịch giải phóng (mục 14); BE tự giới hạn theo phạm vi phiên. */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_HOLD");
  if (!access.ok) return access.response;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json({ message: query.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  const result = await listHoldItems(query.data);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
