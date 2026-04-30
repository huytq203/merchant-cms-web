import { NextRequest, NextResponse } from "next/server";
import { getOrderList } from "@/server/modules/orders/order.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  try {
    const result = await getOrderList({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 10,
      keyword: searchParams.get("keyword") ?? "",
      source: searchParams.get("source") ?? "",
      subMerchantId: searchParams.get("subMerchantId") ?? "",
      createdBy: searchParams.get("createdBy") ?? "",
      status: searchParams.get("status") ?? "",
      createdFromDate: searchParams.get("createdFromDate") ?? "",
      createdToDate: searchParams.get("createdToDate") ?? "",
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[orders] GET error:", error);
    return NextResponse.json({ message: String(error), success: false }, { status: 500 });
  }
}
