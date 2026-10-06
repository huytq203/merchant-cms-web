import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidIdResponse } from "@/lib/be/route-id";
import { getMerchantStatusHistory } from "@/server/modules/kyb/kyb.service";
import {
  requireKybAccess,
  requireMerchantScope,
  toRouteResponse,
} from "@/server/modules/kyb/require-kyb-access";

type Context = { params: Promise<{ id: string }> };

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(request: Request, context: Context) {
  const access = await requireKybAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const outOfScope = requireMerchantScope(access.user, id);
  if (outOfScope) return outOfScope;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  return toRouteResponse(await getMerchantStatusHistory(id, query.data.page));
}
