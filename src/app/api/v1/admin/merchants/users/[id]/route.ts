import { mockStore } from "@/lib/mock/mock-store";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "../types/User.type";
import { updateUserSchema } from "../types/schemas";

type Params = { params: Promise<{ id: string }> };
type MockData = { users: User[] };

const store = mockStore<MockData>("data-user.json");
const delay = () => new Promise((r) => setTimeout(r, 300));

export const GET = async (
  _request: NextRequest,
  { params }: Params,
) => {
  const { id } = await params;
  await delay();
  const mock = await store.read();
  const result = mock.users.find((item) => item.id === id) ?? null;

  if (!result) {
    return NextResponse.json(
      { error: "Không tìm thấy user" },
      { status: 404 },
    );
  }

  return NextResponse.json(result, { status: 200 });
};

export const PUT = async (
  request: NextRequest,
  { params }: Params,
) => {
  const { id } = await params;
  const body = await request.json();
  const validation = updateUserSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  await delay();
  const mock = await store.read();
  const index = mock.users.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy user" },
      { status: 404 },
    );
  }

  const existing = mock.users[index];
  const updated = Object.assign({}, existing, validation.data, {
    id,
    updatedAt: new Date().toISOString(),
  }) as User;

  await store.update((m) => {
    const list = [...m.users];
    list[index] = updated;
    return { ...m, users: list };
  });

  return NextResponse.json(updated, { status: 200 });
};

export const PATCH = async (
  request: NextRequest,
  { params }: Params,
) => {
  const { id } = await params;
  const body = await request.json();
  const validation = updateUserSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  await delay();
  const mock = await store.read();
  const index = mock.users.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy user" },
      { status: 404 },
    );
  }

  const existing = mock.users[index];
  const updateData: Record<string, unknown> = { ...validation.data };

  if (body.lockReason !== undefined) {
    updateData.lockReason = body.lockReason;
  }
  if (body.lockedAt !== undefined) {
    updateData.lockedAt = body.lockedAt;
  }

  const lockReason = body.lockReason ?? existing!.lockReason;
  const status = lockReason ? "locked" : "active";

  const updated = {
    ...existing,
    ...updateData,
    id,
    status,
    updatedAt: new Date().toISOString(),
    assignedSubMerchantsIds: updateData.assignedSubMerchantsIds ?? existing!.assignedSubMerchantsIds,
  } as User;

  await store.update((m) => {
    const list = [...m.users];
    list[index] = updated;
    return { ...m, users: list };
  });

  return NextResponse.json(updated, { status: 200 });
};

export const DELETE = async (
  _request: NextRequest,
  { params }: Params,
) => {
  const { id } = await params;

  await delay();
  const mock = await store.read();
  const index = mock.users.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy user" },
      { status: 404 },
    );
  }

  await store.update((m) => ({
    ...m,
    users: m.users.filter((item) => item.id !== id),
  }));

  return new NextResponse(null, { status: 204 });
};


