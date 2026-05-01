import { NextRequest, NextResponse } from "next/server";
import { getWithdrawalDetail } from "@/server/modules/withdrawals/withdrawal.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await getWithdrawalDetail(id);
    if (!data) {
      return NextResponse.json({ message: "Không tìm thấy giao dịch rút tiền" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[withdrawals/:id] GET error:", error);
    return NextResponse.json({ message: String(error), success: false }, { status: 500 });
  }
}
