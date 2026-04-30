import { NextRequest, NextResponse } from "next/server";
import { getRevenueChart } from "@/server/modules/dashboard/dashboard.service";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") ?? "monthly";

  const result = await getRevenueChart(period);
  if (!result) {
    return NextResponse.json(
      { error: "period phải là: daily | weekly | monthly | yearly" },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
