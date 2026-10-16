import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { reasonBodySchema } from "@/lib/schemas/reason";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { lockSubMerchant } from "@/server/modules/sub-merchants/sub-merchant.service";
import { requireOwnedSubMerchant, requireSubMerchantAccess } from "@/server/modules/sub-merchants/require-sub-merchant-access";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const access = await requireSubMerchantAccess("lock");
  if (!access.ok) return access.response;
  const body = reasonBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedSubMerchant(id, access.user);
  if (detail instanceof NextResponse) return detail;
  const result = await lockSubMerchant(id, body.data.reason);
  return result.success ? NextResponse.json(result.data) : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
