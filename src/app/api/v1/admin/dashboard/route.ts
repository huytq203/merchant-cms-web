import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/server/modules/dashboard/dashboard.service";
import { moduleErrorResponse, requireModuleAccess } from "@/server/modules/sample-data/require-module-access";

/** Dashboard needs the session only: it shows the signed-in merchant's own summary. */
export async function GET() {
  const access = await requireModuleAccess();
  if (!access.ok) return access.response;
  const result = await getDashboardOverview();
  return result.success ? NextResponse.json(result.data) : moduleErrorResponse(result.error);
}
