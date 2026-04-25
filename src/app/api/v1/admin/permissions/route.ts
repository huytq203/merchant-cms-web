import { NextRequest, NextResponse } from "next/server";
import dataPermission from "@/mock/data-permission.json";
import dataUser from "@/mock/data-user.json";
import { PermissionData } from "@/features/permission/types/type";
import { mockStore } from "@/lib/mock/mock-store";

type PermissionType = {
  id: string|number
  name: string
  createdAt: string
  status: string
  permissions: string[]
  createdBy?: string
  updatedBy?: string
  updatedAt?: string
}

type MockData = { permissionGroups: PermissionType[] };

const delay = () => new Promise((r) => setTimeout(r, 300));
const store = mockStore<MockData>("data-permission.json");
const userCountByGroupId = dataUser.users.reduce<Record<string, number>>(
  (acc, user) => {
    if (user.permissionGroupId) {
      acc[user.permissionGroupId] = (acc[user.permissionGroupId] ?? 0) + 1;
    }
    return acc;
  },
  {},
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const keyword = searchParams.get("keyword") || "";
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let results = dataPermission.permissionGroups.map((group) => ({
    ...group,
    userCount: userCountByGroupId[group.id] ?? 0,
  }));

  if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter((item) => item.name.toLowerCase().includes(kw));
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize);

  return NextResponse.json({
    data: paged,
    pagination: { page, pageSize, total },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  await delay();
  const created: PermissionType = {
    id: new Date().getTime(),
    name: body.name,
    status: 'inactive',
    permissions: body.permissions,
    createdBy: "Admin_01",
    updatedBy: "Admin_01",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  await store.update((mock) => ({ ...mock, permissionGroups: [...mock?.permissionGroups, created] }));

return NextResponse.json(created, { status: 201 });
}
