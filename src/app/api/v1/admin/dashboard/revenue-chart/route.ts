import { NextResponse } from "next/server";
import { revenueChartQuerySchema } from "@/features/dashboard/schemas/dashboard.schema";
import { getRevenueChart } from "@/server/modules/dashboard/dashboard.service";
import { moduleErrorResponse, requireModuleAccess } from "@/server/modules/sample-data/require-module-access";

export async function GET(request: Request) {
  const access = await requireModuleAccess();
  if (!access.ok) return access.response;
  const query = revenueChartQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json({ message: "period phải là: 7days | 30days | thisMonth" }, { status: 400 });
  }
  const result = await getRevenueChart(query.data.period);
  return result.success ? NextResponse.json(result.data) : moduleErrorResponse(result.error);
}
