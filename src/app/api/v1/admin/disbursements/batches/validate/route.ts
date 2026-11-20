import { NextResponse } from "next/server";
import { z } from "zod";
import { BATCH_MAX_BYTES } from "@/features/disbursements/utils/disbursement-mapper";
import { uploadDisbursementBatch } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

const subIdSchema = z.uuid();

/**
 * Tải file lô (multipart `subId` + `file`) để BE kiểm: tối đa 2MB, đúng mẫu, 1–1.000 dòng. Chặn file quá lớn và sai đuôi
 * ngay tại đây để không chuyển tiếp byte vô ích; BE vẫn kiểm lại.
 */
export async function POST(request: Request) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const form = await request.formData().catch(() => null);
  const subId = subIdSchema.safeParse(form?.get("subId"));
  const file = form?.get("file");
  if (!subId.success) return badRequest("Vui lòng chọn Sub-merchant chi hộ");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) return badRequest("Chỉ nhận file CSV (.csv)");
  if (file.size === 0) return badRequest("File rỗng, vui lòng chọn file có dữ liệu");
  if (file.size > BATCH_MAX_BYTES) return badRequest("File vượt quá 2MB, vui lòng tách thành nhiều lô");
  const denied = requireSubScope(access.user, subId.data);
  if (denied) return denied;
  const result = await uploadDisbursementBatch(subId.data, file);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
