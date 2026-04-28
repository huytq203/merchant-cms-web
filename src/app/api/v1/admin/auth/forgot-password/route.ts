import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbQuery } from "@/lib/db/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const DEFAULT_PASSWORD = "111111";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { username?: string; email?: string };

  if (!body.username && !body.email) {
    return NextResponse.json(
      { success: false, message: "Vui lòng cung cấp username hoặc email", status: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const rows = await dbQuery<RowDataPacket[]>(
    `SELECT l.id
     FROM logins l
     JOIN users u ON u.id = l.user_id
     WHERE l.username = ? OR u.email = ?
     LIMIT 1`,
    [body.username ?? "", body.email ?? ""],
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Không tìm thấy tài khoản", status: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await dbQuery<ResultSetHeader>("UPDATE logins SET password = ? WHERE id = ?", [hashed, rows[0]!.id]);

  return NextResponse.json({
    success: true,
    message: `Mật khẩu đã được reset thành: ${DEFAULT_PASSWORD}`,
    status: "OK",
  });
}
