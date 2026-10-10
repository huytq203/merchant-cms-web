import { NextResponse } from "next/server";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { z } from "zod";
import { subMerchantFormSchema, subMerchantStatusSchema } from "@/features/sub-merchants/schemas";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { createSubMerchant, listSubMerchants } from "@/server/modules/sub-merchants/sub-merchant.service";
import { requireSubMerchantAccess, selectMerchantId } from "@/server/modules/sub-merchants/require-sub-merchant-access";

const listQuerySchema = paginationQuerySchema.extend({
  code: z.string().trim().max(100).optional(),
  name: z.string().trim().max(100).optional(),
  status: subMerchantStatusSchema.optional(),
});

function requestedMerchantId(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return null;
  if (!("merchantId" in raw) || typeof raw.merchantId !== "string") return null;
  return raw.merchantId;
}

export async function GET(request: Request) {
  const access = await requireSubMerchantAccess();
  if (!access.ok) return access.response;
  const params = new URL(request.url).searchParams;
  const requestedMerchant = params.get("merchantId");
  const merchantId = selectMerchantId(access.user, requestedMerchant);
  if (merchantId instanceof NextResponse) return merchantId;
  const query = listQuerySchema.safeParse(Object.fromEntries(params));
  if (!query.success) {
    return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  }
  // Only a merchant the caller asked for narrows the list; the default merchant must not hide outlets of the others.
  const result = await listSubMerchants(requestedMerchant ? { ...query.data, merchantId } : query.data);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json(
        { message: domainErrorMessage(result.error) },
        { status: toDomainHttpStatus(result.error) },
      );
}

export async function POST(request: Request) {
  const access = await requireSubMerchantAccess();
  if (!access.ok) return access.response;
  const raw: unknown = await request.json().catch(() => null);
  const body = subMerchantFormSchema.safeParse(raw);
  if (!body.success) {
    const message = body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    return NextResponse.json({ message }, { status: 400 });
  }
  const merchantId = selectMerchantId(access.user, requestedMerchantId(raw));
  if (merchantId instanceof NextResponse) return merchantId;
  const result = await createSubMerchant(body.data, merchantId);
  return result.success
    ? NextResponse.json(result.data, { status: 201 })
    : NextResponse.json(
        { message: domainErrorMessage(result.error) },
        { status: toDomainHttpStatus(result.error) },
      );
}
