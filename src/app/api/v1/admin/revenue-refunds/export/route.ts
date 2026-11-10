import { NextResponse } from "next/server";
import { refundQuerySchema } from "@/features/revenue-refunds/schemas";
import { requirePermission } from "@/server/auth/require-permission";
import { badRequest, refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { exportRevenueRefunds } from "@/server/modules/revenue-refunds/revenue-refund.service";

const FALLBACK_DISPOSITION = 'attachment; filename="hoan-tien.csv"';

/** Cùng bộ lọc với danh sách; byte CSV của BE được chuyển nguyên, kể cả BOM UTF-8. */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_REFUND");
  if (!access.ok) return access.response;
  const query = refundQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest("Tham số không hợp lệ");
  const result = await exportRevenueRefunds(query.data);
  if (!result.success) return refundErrorResponse(result.error);
  return new NextResponse(result.data.body, {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": result.data.contentDisposition ?? FALLBACK_DISPOSITION,
      "Cache-Control": "no-store",
    },
  });
}
