import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    { message: "Mật khẩu xác nhận không khớp", path: ["confirmPassword"] },
  );

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized", success: false }, { status: 401 });
  }

  const body = await request.json();
  const validation = changePasswordSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { message: "Dữ liệu không hợp lệ", success: false, errors: validation.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { currentPassword, newPassword } = validation.data;

  const loginEntry = await prisma.login.findFirst({
    where: { userId: session.userId },
    select: { id: true, password: true },
  });
  if (!loginEntry) {
    return NextResponse.json(
      { message: `Không tìm thấy tài khoản ${session.userId}`, success: false },
      { status: 404 },
    );
  }

  const isValid = await bcrypt.compare(currentPassword, loginEntry.password);
  if (!isValid) {
    return NextResponse.json(
      { message: "Mật khẩu hiện tại không đúng", success: false },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.login.update({
    where: { id: loginEntry.id },
    data: { password: hashed },
  });

  return NextResponse.json({ message: "Đổi mật khẩu thành công", success: true });
}
