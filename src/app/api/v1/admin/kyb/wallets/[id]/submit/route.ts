import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidIdResponse } from "@/lib/be/route-id";
import { sensitiveOtpSchema } from "@/lib/schemas/sensitive-otp";
import { submitWallet } from "@/server/modules/kyb/kyb.service";
import {
  requireKybWriteAccess,
  requireOwnedWallet,
  toRouteResponse,
} from "@/server/modules/kyb/require-kyb-access";

type Context = { params: Promise<{ id: string }> };

const bodySchema = z.object({ otp: sensitiveOtpSchema });

/** Sending a dossier for review is confirmed with the email OTP, so a bare POST is refused here. */
export async function POST(request: Request, context: Context) {
  const access = await requireKybWriteAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Cần mã OTP để gửi hồ sơ" }, { status: 400 });
  }
  const notOwned = await requireOwnedWallet(id, access.user);
  if (notOwned) return notOwned;
  return toRouteResponse(await submitWallet(id, body.data.otp));
}
