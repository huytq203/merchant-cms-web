import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { disbursementPaths } from "@/server/modules/disbursements/disbursement.paths";
import { downloadCsv } from "@/server/modules/disbursements/disbursement.service";
import { disbursementErrorResponse, requireDisbursementAccess } from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ id: string }> };

const FALLBACK_DISPOSITION = 'attachment; filename="loi-lo-chi-ho.csv"';

/** File lỗi của lô (dòng lỗi lúc tải + dòng bị từ chối sau khi gửi); BE chỉ cho người đã tải lô lên. */
export async function GET(_request: Request, context: Context) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await downloadCsv(disbursementPaths.batchErrors(id));
  if (!result.success) return disbursementErrorResponse(result.error);
  return new NextResponse(result.data.body, {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": result.data.contentDisposition ?? FALLBACK_DISPOSITION,
      "Cache-Control": "no-store",
    },
  });
}
