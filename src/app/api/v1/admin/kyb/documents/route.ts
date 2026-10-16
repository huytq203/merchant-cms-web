import { NextResponse } from "next/server";
import { DOCUMENT_RULES } from "@/features/kyb/constants/document-rules";
import { isDocumentType, validateDocumentFile } from "@/features/kyb/utils/document-validation";
import { uploadDocument } from "@/server/modules/kyb/kyb.service";
import { requireKybWriteAccess, toRouteResponse } from "@/server/modules/kyb/require-kyb-access";

/** Largest allowed file plus room for the multipart envelope; bigger bodies are refused unread. */
const MAX_BODY_BYTES = Math.max(...Object.values(DOCUMENT_RULES).map((rule) => rule.maxBytes)) + 1024 * 1024;

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export async function POST(request: Request) {
  const access = await requireKybWriteAccess();
  if (!access.ok) return access.response;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return badRequest("Tệp vượt quá dung lượng cho phép");
  const form = await request.formData().catch(() => null);
  if (!form) return badRequest("Dữ liệu tải lên không hợp lệ");
  const documentType = form.get("documentType");
  const file = form.get("file");
  if (!isDocumentType(documentType)) return badRequest("Loại tài liệu không hợp lệ");
  if (!(file instanceof File)) return badRequest("Thiếu tệp tải lên");
  const invalid = validateDocumentFile(file, documentType);
  if (invalid) return badRequest(invalid);
  return toRouteResponse(await uploadDocument(file, documentType), 201);
}
