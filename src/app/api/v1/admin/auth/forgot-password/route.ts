import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import loginData from "@/mock/data-login.json";
import userData from "@/mock/data-user.json";

const DEFAULT_PASSWORD = "111111";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { username?: string; email?: string };

  if (!body.username && !body.email) {
    return NextResponse.json(
      {
        success: false,
        message: "Vui lòng cung cấp username hoặc email",
        status: "BAD_REQUEST",
      },
      { status: 400 },
    );
  }

  const loginEntry = loginData.logins.find(
    (l) =>
      l.username === body.username ||
      userData.users.some((u) => u.id === l.idUser && u.email === body.email),
  );

  if (!loginEntry) {
    return NextResponse.json(
      {
        success: false,
        message: "Không tìm thấy tài khoản",
        status: "NOT_FOUND",
      },
      { status: 404 },
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const updatedLogins = loginData.logins.map((l) =>
      l.id === loginEntry.id ? { ...l, password: hashedPassword } : l,
    );

    const dataPath = path.join(process.cwd(), "src/mock/data-login.json");
    await fs.writeFile(
      dataPath,
      JSON.stringify({ logins: updatedLogins }, null, 2),
      "utf-8",
    );

    return NextResponse.json(
      {
        success: true,
        message: `Mật khẩu đã được reset thành: ${DEFAULT_PASSWORD}`,
        status: "OK",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi hệ thống, vui lòng thử lại sau",
        status: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
