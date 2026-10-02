import { NextRequest, NextResponse } from "next/server";
import {
  getPermissionById,
  updatePermissionGroupById,
} from "@/server/modules/permissions/permission.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await getPermissionById(id);
  if (!item) return NextResponse.json({ error: "Không tìm thấy permission" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const updated = await updatePermissionGroupById(id, {
    name: body.name,
    status: body.status,
    permissions: body.permissions,
  });

  if (!updated) return NextResponse.json({ error: "Không tìm thấy permission" }, { status: 404 });
  return NextResponse.json(updated);
}
