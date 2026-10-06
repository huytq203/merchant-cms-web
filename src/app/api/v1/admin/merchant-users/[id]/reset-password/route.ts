import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resetUserPassword } from "@/server/modules/users/user.service";
import { requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };
const resetBodySchema = z.object({ otp: z.object({ otpSessionId: z.string().min(1), otp: z.string().min(1) }) });

export async function POST(request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  const body = resetBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Cần xác thực OTP để đặt lại mật khẩu" }, { status: 400 });
  return serviceResponse(await resetUserPassword(id, body.data.otp));
}
