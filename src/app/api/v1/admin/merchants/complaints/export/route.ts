import { NextResponse } from "next/server";
import { complaintListQuerySchema } from "@/features/complaints/schemas/complaint.schema";
import { requirePermission } from "@/server/auth/require-permission";
import { exportComplaints } from "@/server/modules/complaints/complaint.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

const FALLBACK_DISPOSITION = 'attachment; filename="khieu-nai.csv"';

/** Same filter as the list (paging ignored); the BE CSV bytes are passed through untouched, BOM included. */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_DISPUTE");
  if (!access.ok) return access.response;
  const query = complaintListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const result = await exportComplaints(query.data);
  if (!result.success) return beErrorResponse(result.error);
  return new NextResponse(result.data.body, {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": result.data.contentDisposition ?? FALLBACK_DISPOSITION,
      "Cache-Control": "no-store",
    },
  });
}
