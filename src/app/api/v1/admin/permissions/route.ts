import { NextRequest, NextResponse } from "next/server";
import {
  getPermissionList,
  createPermissionGroup,
} from "@/server/modules/permissions/permission.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await getPermissionList({
    keyword: searchParams.get("keyword") ?? "",
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const created = await createPermissionGroup({
    name: body.name,
    permissions: Array.isArray(body.permissions) ? body.permissions : [],
  });

  return NextResponse.json(created, { status: 201 });
}
