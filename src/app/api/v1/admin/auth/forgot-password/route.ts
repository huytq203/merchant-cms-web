import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/features/auth/schemas";
import { toHttpStatus } from "@/lib/be/errors";
import { FORGOT_PASSWORD_MESSAGE, forgotPassword } from "@/server/modules/auth/merchant-password.service";

export async function POST(request: Request) {
  const body = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Email không hợp lệ" }, { status: 400 });
  }
  const result = await forgotPassword(body.data.email);
  if (!result.success) {
    return NextResponse.json({ message: result.error.message }, { status: toHttpStatus(result.error) });
  }
  return NextResponse.json({ success: true, message: FORGOT_PASSWORD_MESSAGE });
}
