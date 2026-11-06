import { NextResponse } from "next/server";
import {
  complaintListQuerySchema,
  createComplaintBodySchema,
} from "@/features/complaints/schemas/complaint.schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createComplaint, listComplaints } from "@/server/modules/complaints/complaint.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });

/** Permission only, like the transaction list: a user assigned to Subs alone still has a scope on the BE. */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_DISPUTE");
  if (!access.ok) return access.response;
  const query = complaintListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest("Tham số không hợp lệ");
  const result = await listComplaints(query.data);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}

/** Shared by the complaint screen and the "Tra soát" action of the transaction screen. */
export async function POST(request: Request) {
  const access = await requirePermission("CREATE_DISPUTE");
  if (!access.ok) return access.response;
  const body = createComplaintBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const result = await createComplaint(body.data);
  return result.success ? NextResponse.json(result.data, { status: 201 }) : beErrorResponse(result.error);
}
