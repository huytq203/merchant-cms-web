import { NextRequest, NextResponse } from "next/server";
import { getTransactionList } from "@/server/modules/transactions/transaction.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const result = await getTransactionList({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 10,
      keyword: searchParams.get("keyword") ?? "",
      bankCode: searchParams.get("bankCode") ?? "",
      paymentMethod: searchParams.get("paymentMethod") ?? "",
      createdFromDate: searchParams.get("createdFromDate") ?? "",
      createdToDate: searchParams.get("createdToDate") ?? "",
      subMerchantId: searchParams.get("subMerchantId") ?? "",
      status: searchParams.get("status") ?? "",
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[transaction] GET error:", error);
    return NextResponse.json(
      { message: String(error), success: false },
      { status: 500 },
    );
  }
}
