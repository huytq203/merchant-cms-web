import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock/mock-store";
import type { SubMerchant } from "@/app/api/v1/admin/merchants/types/merchants";
import { createSubMerchantSchema } from "@/app/api/v1/admin/merchants/types/schemas";

type MockData = { subMerchants: SubMerchant[] };

const store = mockStore<MockData>("data-submechant.json");
const delay = () => new Promise((r) => setTimeout(r, 300));

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const keyword = searchParams.get("keyword") ?? "";
  const status = searchParams.get("status") ?? "";

  await delay();
  const mock = await store.read();
  let results = [...mock.subMerchants];

  if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter((item) =>
      (item.name as string).toLowerCase().includes(kw),
    );
  }
  if (status) {
    results = results.filter((item) => item.status === status);
  }

  const total = results.length;
  const paged = results.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    data: paged,
    pagination: { page, pageSize, total },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createSubMerchantSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  await delay();

  const created: SubMerchant = {
    ...(validation.data as Record<string, string | boolean>),
    id: `SUB-${Date.now()}`,
    createdAt: new Date().toISOString(),
    merchantId: validation.data.merchantId ?? `MCH-${Date.now()}`,
  } as SubMerchant;

  await store.update((mock) => ({
    ...mock,
    subMerchants: [...mock.subMerchants, created],
  }));

  return NextResponse.json(created, { status: 201 });
}
