import { NextResponse } from "next/server";
import { pushTokenSchema } from "@/features/notifications/schemas";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import type { BeResult } from "@/lib/be/client";
import { requirePermission } from "@/server/auth/require-permission";
import { registerPushToken, unregisterPushToken } from "@/server/modules/notifications/push-token.service";

/** Đọc và kiểm body; trả 400 tiếng Việt khi không phải JSON hoặc thiếu token. */
async function parseBody(request: Request) {
  const json: unknown = await request.json().catch(() => undefined);
  const parsed = pushTokenSchema.safeParse(json);
  return parsed.success
    ? { ok: true as const, body: parsed.data }
    : { ok: false as const, response: NextResponse.json({ message: parsed.error?.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 }) };
}

function toResponse(result: BeResult<undefined>): NextResponse {
  return result.success
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}

/** Đăng ký token push của trình duyệt cho user đang đăng nhập (chỉ cần session, không cần mã quyền). */
export async function POST(request: Request) {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;
  return toResponse(await registerPushToken(parsed.body));
}

/** Gỡ token push khi đăng xuất; phải gọi trước khi phiên bị xóa. */
export async function DELETE(request: Request) {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;
  return toResponse(await unregisterPushToken(parsed.body));
}
