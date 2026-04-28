import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { dbQuery } from "@/lib/db/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

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

  const rows = await dbQuery<RowDataPacket[]>(
    "SELECT id, password FROM logins WHERE user_id = ?",
    [session.userId],
  );
  if (rows.length === 0) {
    return NextResponse.json(
      { message: `Không tìm thấy tài khoản ${session.userId}`, success: false },
      { status: 404 },
    );
  }

  const loginEntry = rows[0]!;
  const isValid = await bcrypt.compare(currentPassword, loginEntry.password as string);
  if (!isValid) {
    return NextResponse.json(
      { message: "Mật khẩu hiện tại không đúng", success: false },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await dbQuery<ResultSetHeader>("UPDATE logins SET password = ? WHERE id = ?", [hashed, loginEntry.id]);

  return NextResponse.json({ message: "Đổi mật khẩu thành công", success: true });
}
