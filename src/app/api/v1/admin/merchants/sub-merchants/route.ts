import { NextRequest, NextResponse } from "next/server";
import { createSubMerchantSchema } from "@/app/api/v1/admin/merchants/types/Schemas";
import {
  getSubMerchantList,
  createSubMerchant,
} from "@/server/modules/sub-merchants/sub-merchant.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await getSubMerchantList({
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
    keyword: searchParams.get("keyword") ?? "",
    status: searchParams.get("status") ?? "",
  });

  return NextResponse.json(result);
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

  const created = await createSubMerchant({
    ...validation.data,
    merchantId: validation.data.merchantId ?? "",
  });

  return NextResponse.json(created, { status: 201 });
}
