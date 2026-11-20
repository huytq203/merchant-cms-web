import "server-only";

import { NextResponse } from "next/server";
import type { MerchantPermission } from "@/features/auth/permissions";
import { domainErrorMessage, toDomainHttpStatus, type BeError } from "@/lib/be/errors";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import type { SessionUser } from "@/types/auth";

/** Cùng câu với BE (6323): lệnh có thể đã lưu, gửi lại cùng mã yêu cầu. */
export const UNCONFIRMED_MESSAGE = "Chưa xác nhận được lệnh chi hộ với hệ thống chi, vui lòng gửi lại cùng mã yêu cầu sau ít phút";
/** Cùng câu với `ReadUnavailableException` của BE (6323) cho thao tác đọc: đọc không có tác dụng phụ nên chỉ cần thử lại. */
export const READ_UNAVAILABLE_MESSAGE = "Chưa đọc được dữ liệu chi hộ từ hệ thống chi, vui lòng thử lại sau ít phút";
const INQUIRY_UNAVAILABLE_MESSAGE = "Chưa tra được tên chủ tài khoản, vui lòng thử lại";

export const forbidden = () => NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
export const badRequest = (message = "Tham số không hợp lệ") => NextResponse.json({ message }, { status: 400 });

export function requireDisbursementAccess(permission: MerchantPermission): Promise<PermissionAccess> {
  return requirePermission(permission);
}

/** Phiên chỉ gán một số Sub thì chỉ được dùng các Sub đó; phiên không giới hạn để BE kiểm phạm vi. */
export function requireSubScope(user: SessionUser, subId: string): NextResponse | null {
  return user.subMerchantIds.length > 0 && !user.subMerchantIds.includes(subId) ? forbidden() : null;
}

/** Như {@link requireSubScope} cho danh sách Sub của bộ lọc: một Sub ngoài phạm vi phiên là 403. `subIds` vắng để BE tự giới hạn. */
export function requireSubsScope(user: SessionUser, subIds: readonly string[] | undefined): NextResponse | null {
  if (!subIds || user.subMerchantIds.length === 0) return null;
  return subIds.every((subId) => user.subMerchantIds.includes(subId)) ? null : forbidden();
}

/** BE 401 ở đây là chuỗi realm từ chối chứ không phải phiên hết hạn nên thành 403 (xem toDomainHttpStatus). */
export function disbursementErrorResponse(error: BeError): NextResponse {
  const body = error.fieldErrors ? { message: error.message, details: error.fieldErrors } : { message: error.message };
  return NextResponse.json({ ...body, code: error.code }, { status: toDomainHttpStatus(error) });
}

/** Lỗi hệ thống (5xx), timeout, mất kết nối: không biết BE đã xử lý hay chưa. */
const isUnreachable = (error: BeError) => error.status >= 500 || error.status === 0;

/**
 * Tạo lệnh: mọi lỗi hệ thống đều có thể xảy ra SAU khi lệnh đã lưu nên trả 503 mã 6323 kèm câu "gửi lại cùng mã yêu cầu".
 * Nếu để lọt 502 chung chung, người dùng sẽ tưởng lệnh thất bại và đổi mã, dẫn tới chi hai lần.
 */
export function createErrorResponse(error: BeError): NextResponse {
  if (!isUnreachable(error)) return disbursementErrorResponse(error);
  return NextResponse.json({ message: UNCONFIRMED_MESSAGE, code: "6323" }, { status: 503 });
}

/** Tra tên: 5xx/timeout là "chưa tra được" (6328), 429 giữ nguyên để FE báo chờ. */
export function inquiryErrorResponse(error: BeError): NextResponse {
  if (!isUnreachable(error)) return disbursementErrorResponse(error);
  return NextResponse.json({ message: INQUIRY_UNAVAILABLE_MESSAGE, code: "6328" }, { status: 503 });
}

/**
 * Đọc (danh sách, chi tiết, lô, xuất): lỗi hệ thống/timeout/mất kết nối thành 503 (6323) kèm câu "thử lại sau ít phút".
 * Nếu để lọt như 502 chung chung thì mất câu của BE (toBeError thay câu 5xx bằng câu chung). Lỗi 4xx (404 ngoài phạm vi,
 * 400 bộ lọc sai, xuất vượt số dòng...) giữ nguyên câu tiếng Việt của BE.
 */
export function readErrorResponse(error: BeError): NextResponse {
  if (!isUnreachable(error)) return disbursementErrorResponse(error);
  return NextResponse.json({ message: READ_UNAVAILABLE_MESSAGE, code: "6323" }, { status: 503 });
}

/** Câu hiển thị cho trang server-render khi đọc lỗi: cùng quy tắc với {@link readErrorResponse}. */
export function readFailureMessage(error: BeError): string {
  return isUnreachable(error) ? READ_UNAVAILABLE_MESSAGE : domainErrorMessage(error);
}
