import { NextResponse } from "next/server";
import { disbursementPaths } from "@/server/modules/disbursements/disbursement.paths";
import { downloadCsv } from "@/server/modules/disbursements/disbursement.service";
import {
  disbursementErrorResponse,
  requireDisbursementAccess,
} from "@/server/modules/disbursements/disbursement-response";

const FALLBACK_DISPOSITION = 'attachment; filename="mau-lo-chi-ho.csv"';

/** File mẫu lô chi hộ: CSV UTF-8 có BOM, chỉ có dòng tiêu đề; byte của BE được chuyển nguyên. */
export async function GET() {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const result = await downloadCsv(disbursementPaths.batchTemplate);
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
