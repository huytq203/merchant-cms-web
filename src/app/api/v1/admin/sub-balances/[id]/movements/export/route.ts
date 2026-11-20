import { NextResponse } from "next/server";
import { movementExportFilterSchema } from "@/features/sub-balances/movement-schemas";
import { subBalanceErrorMessage } from "@/features/sub-balances/utils/sub-balance-error";
import { safeCsvDisposition } from "@/lib/be/safe-csv-disposition";
import { toDomainHttpStatus } from "@/lib/be/errors";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { exportSubBalanceMovements } from "@/server/modules/sub-balances/sub-balance.service";

type Context = { params: Promise<{ id: string }> };

const FALLBACK_FILE = "bien-dong-so-du.csv";

/**
 * CSV biến động số dư của một Sub. Quyền EXPORT_BALANCE (khác VIEW_BALANCE của danh sách). Byte CSV của BE được chuyển nguyên, kể
 * cả BOM (tên file trong Content-Disposition được lọc lại như route xuất lệnh chi hộ); lỗi giữ mã (6334 vượt 10.000 dòng) và câu tiếng Việt của BE để popup hiện lại đúng.
 */
export async function GET(request: Request, context: Context) {
  const access = await requirePermission("EXPORT_BALANCE");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalid = invalidIdResponse(id);
  if (invalid) return invalid;
  const filter = movementExportFilterSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!filter.success) {
    return NextResponse.json({ message: filter.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  const result = await exportSubBalanceMovements(id, filter.data);
  if (!result.success) {
    return NextResponse.json({ message: subBalanceErrorMessage(result.error), code: result.error.code }, { status: toDomainHttpStatus(result.error) });
  }
  return new NextResponse(result.data.body, {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": safeCsvDisposition(result.data.contentDisposition, FALLBACK_FILE),
      "Cache-Control": "no-store",
    },
  });
}
