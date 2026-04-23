import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock/mock-store";

type SubMerchant = Record<string, unknown>;
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
    results = results.filter((item) => (item.name as string).toLowerCase().includes(kw));
  }
  if (status) {
    results = results.filter((item) => item.status === status);
  }

  const total = results.length;
  const paged = results.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ data: paged, pagination: { page, pageSize, total } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.businessType || !body.contact) {
    return NextResponse.json(
      { error: "name, businessType, contact là bắt buộc" },
      { status: 422 },
    );
  }

  await delay();

  const created = {
    id: `SUB-${Date.now()}`,
    name: body.name,
    businessType: body.businessType,
    contact: body.contact,
    status: body.status ?? "active",
    createdAt: new Date().toISOString(),
  };

  await store.update((mock) => ({
    ...mock,
    subMerchants: [...mock.subMerchants, created],
  }));

  return NextResponse.json(created, { status: 201 });
}