import { NextRequest, NextResponse } from "next/server";
import { updateUserSchema, patchUserLockSchema } from "../types/schemas";
import {
  getUserById,
  updateUserById,
  patchUserLock,
  removeUser,
} from "@/server/modules/users/user.service";

type Params = { params: Promise<{ id: string }> };

export const GET = async (_request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });
  return NextResponse.json(user);
};

export const PUT = async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const body = await request.json();
  const validation = updateUserSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await updateUserById(id, validation.data);
  if (!updated) return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });
  return NextResponse.json(updated);
};

export const PATCH = async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const body = await request.json();
  const validation = patchUserLockSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await patchUserLock(id, validation.data);
  if (!updated) return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });
  return NextResponse.json(updated);
};

export const DELETE = async (_request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const removed = await removeUser(id);
  if (!removed) return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
};
