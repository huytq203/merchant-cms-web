import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { subMerchantFormSchema } from "@/features/sub-merchants/schemas";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { updateSubMerchant } from "@/server/modules/sub-merchants/sub-merchant.service";
import { requireOwnedSubMerchant, requireSubMerchantAccess } from "@/server/modules/sub-merchants/require-sub-merchant-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireSubMerchantAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedSubMerchant(id, access.user);
  return detail instanceof NextResponse ? detail : NextResponse.json(detail);
}

export async function PUT(request: Request, context: Context) {
  const access = await requireSubMerchantAccess();
  if (!access.ok) return access.response;
  const body = subMerchantFormSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedSubMerchant(id, access.user);
  if (detail instanceof NextResponse) return detail;
  const result = await updateSubMerchant(id, body.data);
  return result.success ? NextResponse.json(result.data) : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
