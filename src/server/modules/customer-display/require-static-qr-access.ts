import "server-only";

import { NextResponse } from "next/server";
import type { SessionUser } from "@/types/auth";
import type { StaticQr } from "@/features/static-qrs/schemas";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";
import { getStaticQr } from "./customer-display.service";

/**
 * QR tĩnh thuộc một Sub: người dùng chỉ thao tác được mã của Sub trong phạm vi session (`subMerchantIds`).
 * Mã của Sub khác trả 404 (không lộ là mã có tồn tại), giống cách màn đơn hàng xử lý đơn của merchant khác.
 */
export async function requireOwnedStaticQr(id: string, user: SessionUser): Promise<StaticQr | NextResponse> {
  const result = await getStaticQr(id);
  if (!result.success) return beErrorResponse(result.error);
  if (!user.subMerchantIds.includes(result.data.subMerchantId)) {
    return NextResponse.json({ message: "Không tìm thấy mã QR tĩnh" }, { status: 404 });
  }
  return result.data;
}
