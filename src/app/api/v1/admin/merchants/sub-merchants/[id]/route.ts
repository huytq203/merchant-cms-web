import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock/mock-store";
import type { SubMerchant } from "@/app/api/v1/admin/merchants/types/merchants";
import {
  updateSubMerchantSchema,
  patchSubMerchantStatusSchema,
} from "@/app/api/v1/admin/merchants/types/schemas";

type Params = { params: Promise<{ id: string }> };
type MockData = { subMerchants: SubMerchant[] };

const store = mockStore<MockData>("data-submechant.json");
const delay = () => new Promise((r) => setTimeout(r, 300));

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await delay();

  const mock = await store.read();
  const item = mock.subMerchants.find((m) => m.id === id) ?? null;
  if (!item) {
    return NextResponse.json(
      { error: "Không tìm thấy sub-merchant" },
      { status: 404 },
    );
  }

  return NextResponse.json(item, { status: 200 });
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

  await delay();
  const mock = await store.read();
  const index = mock.subMerchants.findIndex((m) => m.id === id);
  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy sub-merchant" },
      { status: 404 },
    );
  }

  const existing = mock.subMerchants[index];
  const updated = Object.assign({}, existing, validation.data, {
    id,
  }) as SubMerchant;

  await store.update((m) => {
    const list = [...m.subMerchants];
    list[index] = updated;
    return { ...m, subMerchants: list };
  });

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

  await delay();
  const mock = await store.read();
  const index = mock.subMerchants.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy sub-merchant" },
      { status: 404 },
    );
  }
  const existing = mock.subMerchants[index];
   const updateData = { ...validation.data };

  const lockReason =
    updateData.lockReason !== undefined
      ? updateData.lockReason
      : existing!.lockReason;
  const status = lockReason ? "locked" : "active";

  const updated = {
    ...existing,
    ...updateData,
    id,
    status,
    updatedAt: new Date().toISOString(),
  } as SubMerchant;

  await store.update((m) => {
    const list = [...m.subMerchants];
    list[index] = updated;
    return { ...m, subMerchants: list };
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  await delay();
  const mock = await store.read();
  const index = mock.subMerchants.findIndex((m) => m.id === id);
  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy sub-merchant" },
      { status: 404 },
    );
  }

  await store.update((m) => ({
    ...m,
    subMerchants: m.subMerchants.filter((item) => item.id !== id),
  }));

  return new NextResponse(null, { status: 204 });
}
