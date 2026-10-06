import { NextResponse } from "next/server";
import { complaintListQuerySchema } from "@/features/complaints/schemas/complaint.schema";
import { listComplaints } from "@/server/modules/complaints/complaint.service";
import { moduleErrorResponse, requireModuleAccess } from "@/server/modules/sample-data/require-module-access";

export async function GET(request: Request) {
  const access = await requireModuleAccess("VIEW_DISPUTE");
  if (!access.ok) return access.response;
  const query = complaintListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const result = await listComplaints({ ...query.data, merchantId: access.merchantId });
  return result.success ? NextResponse.json(result.data) : moduleErrorResponse(result.error);
}
