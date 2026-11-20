import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidIdResponse } from "@/lib/be/route-id";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { listDisbursementTopups } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ subId: string }> };

const listQuerySchema = paginationQuerySchema.extend({ status: z.string().trim().max(30).optional() });

/** Lệnh nạp (Chi hộ/Hoàn) của Sub, chỉ đọc. */
export async function GET(request: Request, context: Context) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { subId } = await context.params;
  const invalidId = invalidIdResponse(subId);
  if (invalidId) return invalidId;
  const denied = requireSubScope(access.user, subId);
  if (denied) return denied;
  const query = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest();
  const result = await listDisbursementTopups(subId, query.data);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
