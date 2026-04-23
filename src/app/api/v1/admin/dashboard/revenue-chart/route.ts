import { NextRequest, NextResponse } from "next/server";
import chartData from "@/mock/data-chart.json";
import type { ChartPeriod } from "@/features/dashboard/types/Dashboard.type";

const VALID_PERIODS: ChartPeriod[] = ["daily", "weekly", "monthly", "yearly"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const period = (searchParams.get("period") ?? "monthly") as ChartPeriod;

  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json(
      { error: `period phải là một trong: ${VALID_PERIODS.join(", ")}` },
      { status: 400 },
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json(chartData[period]);
}
