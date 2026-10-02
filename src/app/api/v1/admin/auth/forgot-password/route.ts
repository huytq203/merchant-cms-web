import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const DEFAULT_PASSWORD = "111111";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { username?: string; email?: string };
  const identifier = body.username?.trim() || body.email?.trim();

  if (!identifier) {
    return NextResponse.json(
      { success: false, message: "Vui lòng cung cấp username hoặc email", status: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const login = await prisma.login.findFirst({
    where: {
      OR: [
        { username: identifier },
        { user: { email: identifier } },
      ],
    },
    select: { id: true },
  });

  if (!login) {
    return NextResponse.json(
      { success: false, message: "Không tìm thấy tài khoản", status: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await prisma.login.update({
    where: { id: login.id },
    data: { password: hashed },
  });

  return NextResponse.json({
    success: true,
    message: `Mật khẩu đã được reset thành: ${DEFAULT_PASSWORD}`,
    status: "OK",
  });
}
