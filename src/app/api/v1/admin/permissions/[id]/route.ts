import { mockStore } from "@/lib/mock/mock-store";
import { NextRequest, NextResponse } from "next/server";
import dataUser from "@/mock/data-user.json";
type Params = { params: Promise<{ id: string }> };
type PermissionGroup = Record<string, unknown>;
type MockData = { permissionGroups: PermissionGroup[] };
const store = mockStore<MockData>("data-permission.json");
const delay = () => new Promise((r) => setTimeout(r, 300));

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await delay();
  const mockData = await store.read();
  const userCountByGroupId = dataUser.users.reduce<Record<string, number>>(
  (acc, user) => {
    if (user.permissionGroupId) {
      acc[user.permissionGroupId] = (acc[user.permissionGroupId] ?? 0) + 1;
    }
    return acc;
  },
  {},
);

  const item = mockData.permissionGroups.find(
    (p) => p.id === Number(id) || p.id === String(id),
  );
  if (!item) {
    return NextResponse.json(
      { error: "Không tìm thấy permission" },
      { status: 404 },
    );
  }
  const itemWithCount = {
    ...item,
    userCount: userCountByGroupId[String(item?.id)] ?? 0,
  };
  return NextResponse.json(itemWithCount);
}

export async function PUT(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await delay();
  const mockData = await store.read();
  const index = mockData.permissionGroups.findIndex(
    (m) => m.id === Number(id) || m.id === String(id),
  );
  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy permission" },
      { status: 404 },
    );
  }
  const existing = mockData.permissionGroups[index];
  const body = await _request.json();
  const updated: PermissionGroup = {
    ...existing,
    name: body.name ?? existing?.name,
    status: body.status ?? existing?.status,
    permissions: body.permissions ?? existing?.permissions,
    updatedAt: new Date().toISOString(),
    updatedBy: "admin",
  };
  mockData.permissionGroups[index] = updated;
  await store.write(mockData);
  return NextResponse.json(updated);
}
