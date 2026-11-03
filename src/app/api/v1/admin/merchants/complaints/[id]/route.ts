import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { getComplaint } from "@/server/modules/complaints/complaint.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

/** Detail with messages and attachments; the BE answers 6201 for a complaint outside the session scope. */
export async function GET(_request: Request, context: Context) {
  const access = await requirePermission("VIEW_DISPUTE");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await getComplaint(id);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
