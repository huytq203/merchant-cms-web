import { NextRequest, NextResponse } from "next/server";
import { createUserSchema } from "./types/schemas";
import { getUserList, createUser } from "@/server/modules/users/user.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await getUserList({
    keyword: searchParams.get("name") ?? searchParams.get("email") ?? "",
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
    permissionGroupId: searchParams.get("permissionGroupId"),
    status: searchParams.get("status"),
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createUserSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  const created = await createUser(validation.data);
  return NextResponse.json(created, { status: 201 });
}
