import { NextResponse } from "next/server";
import { orderExportBodySchema } from "@/features/disbursements/schemas/disbursement-filter.schema";
import { exportDisbursements } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  readErrorResponse,
  requireDisbursementAccess,
  requireSubsScope,
} from "@/server/modules/disbursements/disbursement-response";

const FALLBACK_FILE = "chi-ho.csv";
const SAFE_FILE = /^[A-Za-z0-9._-]{1,100}\.csv$/;

/** Lọc lại tên file BE gửi: chỉ chữ/số/._- và đuôi .csv; tên có ".." hay ký tự lạ (xuống dòng, đường dẫn) thì dùng tên mặc định. */
function safeDisposition(header: string | null): string {
  const name = /filename="?([^";]+)"?/i.exec(header ?? "")?.[1]?.trim() ?? "";
  return `attachment; filename="${SAFE_FILE.test(name) && !name.includes("..") ? name : FALLBACK_FILE}"`;
}

/**
 * Xuất CSV theo đúng bộ lọc của danh sách. Cần quyền xuất riêng (EXPORT_DISBURSEMENT), không chỉ quyền xem. Byte CSV
 * của BE (UTF-8 có BOM, STK che, tối đa 50.000 dòng) được chuyển nguyên; không lưu file ở server.
 */
export async function POST(request: Request) {
  const access = await requireDisbursementAccess("EXPORT_DISBURSEMENT");
  if (!access.ok) return access.response;
  const body = orderExportBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const denied = requireSubsScope(access.user, body.data.subIds);
  if (denied) return denied;
  const result = await exportDisbursements(body.data);
  if (!result.success) return readErrorResponse(result.error);
  return new NextResponse(result.data.body, {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": safeDisposition(result.data.contentDisposition),
      "Cache-Control": "no-store",
    },
  });
}
