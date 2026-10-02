import { NextRequest, NextResponse } from "next/server";
import { getComplaintList } from "@/server/modules/complaints/complaint.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  try {
    const result = await getComplaintList({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 10,
      keyword: searchParams.get("keyword") ?? "",
      status: searchParams.get("status") ?? "",
      source: searchParams.get("source") ?? "",
      createdFromDate: searchParams.get("createdFromDate") ?? "",
      createdToDate: searchParams.get("createdToDate") ?? "",
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[complaints] GET error:", error);
    return NextResponse.json({ message: String(error), success: false }, { status: 500 });
  }
}
