import { NextResponse } from "next/server";
import { replyComplaintBodySchema } from "@/features/complaints/schemas/complaint.schema";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { replyComplaint } from "@/server/modules/complaints/complaint.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

/** Merchant reply; the BE refuses any status other than PROCESSING with 6205. */
export async function POST(request: Request, context: Context) {
  const access = await requirePermission("REPLY_DISPUTE");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const body = replyComplaintBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const result = await replyComplaint(id, body.data);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
