import { NextResponse } from "next/server";
import { z } from "zod";

import { newPasswordSchema } from "@/features/auth/schemas";
import { getServerSession } from "@/lib/auth/session";
import { toHttpStatus } from "@/lib/be/errors";
import { changePassword } from "@/server/modules/auth/merchant-password.service";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: newPasswordSchema,
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn" }, { status: 401 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const result = await changePassword({
    currentPassword: body.data.currentPassword,
    newPassword: body.data.newPassword,
    confirmPassword: body.data.newPassword,
  });
  if (!result.success) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: toHttpStatus(result.error) });
  }
  return NextResponse.json({ success: true });
}
