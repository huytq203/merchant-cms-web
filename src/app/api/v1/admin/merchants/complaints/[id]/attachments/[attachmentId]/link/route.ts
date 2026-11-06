import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { getAttachmentLink } from "@/server/modules/complaints/complaint.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string; attachmentId: string }> };

/** A five-minute read link; the client opens it right away instead of keeping it. */
export async function GET(_request: Request, context: Context) {
  const access = await requirePermission("VIEW_DISPUTE");
  if (!access.ok) return access.response;
  const { id, attachmentId } = await context.params;
  const invalidId = invalidIdResponse(id) ?? invalidIdResponse(attachmentId);
  if (invalidId) return invalidId;
  const result = await getAttachmentLink(id, attachmentId);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
