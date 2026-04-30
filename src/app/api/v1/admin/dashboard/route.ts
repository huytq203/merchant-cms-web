import { NextRequest, NextResponse } from "next/server";
import { getDashboardTransactions } from "@/server/modules/dashboard/dashboard.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await getDashboardTransactions({
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
    keyword: searchParams.get("keyword") ?? "",
    status: searchParams.get("status") ?? "",
  });

  return NextResponse.json(result);
}
