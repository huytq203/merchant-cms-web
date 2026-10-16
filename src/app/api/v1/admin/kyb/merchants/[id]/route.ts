import { NextResponse } from "next/server";
import { merchantFormSchema, merchantStagingSchema } from "@/features/kyb/schemas/merchant-profile.schema";
import { invalidIdResponse } from "@/lib/be/route-id";
import { getMerchant, updateMerchant } from "@/server/modules/kyb/kyb.service";
import {
  requireKybAccess,
  requireKybWriteAccess,
  requireMerchantScope,
  toRouteResponse,
} from "@/server/modules/kyb/require-kyb-access";

type Context = { params: Promise<{ id: string }> };

const updateBodySchema = merchantFormSchema.extend(merchantStagingSchema.shape);

export async function GET(_request: Request, context: Context) {
  const access = await requireKybAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const outOfScope = requireMerchantScope(access.user, id);
  if (outOfScope) return outOfScope;
  return toRouteResponse(await getMerchant(id));
}

export async function PUT(request: Request, context: Context) {
  const access = await requireKybWriteAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const outOfScope = requireMerchantScope(access.user, id);
  if (outOfScope) return outOfScope;
  const body = updateBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    const message = body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    return NextResponse.json({ message }, { status: 400 });
  }
  const { logoStagingId, productImageStagingIds, contractStagingId, ...values } = body.data;
  const stagingIds = { logoStagingId, productImageStagingIds, contractStagingId };
  return toRouteResponse(await updateMerchant(id, values, stagingIds));
}
