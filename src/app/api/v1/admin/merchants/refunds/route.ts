import { NextResponse } from "next/server";
import { refundListQuerySchema } from "@/features/refund/schemas/Refund.schema";
import { listRefunds } from "@/server/modules/refund/refund.service";
import { moduleErrorResponse, requireModuleAccess } from "@/server/modules/sample-data/require-module-access";

export async function GET(request: Request) {
  const access = await requireModuleAccess("VIEW_REFUND");
  if (!access.ok) return access.response;
  const query = refundListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const result = await listRefunds({ ...query.data, merchantId: access.merchantId });
  return result.success ? NextResponse.json(result.data) : moduleErrorResponse(result.error);
}
