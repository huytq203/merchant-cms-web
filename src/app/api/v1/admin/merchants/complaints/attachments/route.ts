import { NextResponse } from "next/server";
import { EVIDENCE_MAX_BYTES } from "@/features/complaints/constants/Complaint.constants";
import { requirePermission } from "@/server/auth/require-permission";
import { uploadAttachment } from "@/server/modules/complaints/complaint.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

/** Largest allowed file plus room for the multipart envelope; bigger bodies are refused unread. */
const MAX_BODY_BYTES = EVIDENCE_MAX_BYTES + 1024 * 1024;

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });

/**
 * Stages one evidence file for a create (CREATE_DISPUTE) or a reply (REPLY_DISPUTE). Format and size are
 * checked by the BE on the real content; its Vietnamese `detail` is forwarded as is.
 */
export async function POST(request: Request) {
  const access = await requirePermission(["CREATE_DISPUTE", "REPLY_DISPUTE"]);
  if (!access.ok) return access.response;
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return badRequest("Dung lượng file vượt quá 10MB");
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("Thiếu tệp tải lên");
  const result = await uploadAttachment(file);
  return result.success
    ? NextResponse.json({ attachmentId: result.data }, { status: 201 })
    : beErrorResponse(result.error);
}
