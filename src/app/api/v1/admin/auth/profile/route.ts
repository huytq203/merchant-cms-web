import { NextResponse } from "next/server";

/** Profile editing awaits a merchant profile endpoint. */
export async function PATCH() {
  return NextResponse.json(
    { message: "Chức năng cập nhật thông tin tài khoản chưa được hỗ trợ", success: false },
    { status: 501 },
  );
}
