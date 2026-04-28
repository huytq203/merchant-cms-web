import { NextRequest, NextResponse } from "next/server";
import {
  updateSubMerchantSchema,
  patchSubMerchantStatusSchema,
} from "@/app/api/v1/admin/merchants/types/schemas";
import {
  getSubMerchantById,
  updateSubMerchantById,
  toggleSubMerchantStatus,
  removeSubMerchant,
} from "@/server/modules/sub-merchants/sub-merchant.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await getSubMerchantById(id);
  if (!item) return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const validation = updateSubMerchantSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await updateSubMerchantById(id, validation.data);
  if (!updated) return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const validation = patchSubMerchantStatusSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  const existing = await getSubMerchantById(id);
  if (!existing) return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });

  const updated = await toggleSubMerchantStatus(id, validation.data.lockReason, existing.lockReason);
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const removed = await removeSubMerchant(id);
  if (!removed) return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
