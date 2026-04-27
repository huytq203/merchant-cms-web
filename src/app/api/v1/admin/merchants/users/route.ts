import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dataUser from "@/mock/data-user.json";
import dataPermission from "@/mock/data-permission.json";
import { mockStore } from "@/lib/mock/mock-store";
import { createUserSchema } from "./types/schemas";

interface UserType {
  id: string;
  name: string;
  email: string;
  phone: string;
  permissionGroupId: string;
  permissionGroupName: string;
  subMerchantScope: string;
  assignedSubMerchantsIds: string[];
  assignedSubMerchantCount: number;
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive";
}

interface LoginType {
  id: string;
  idUser: string;
  username: string;
  password: string;
}

type MockData = { users: UserType[] };

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));
const store = mockStore<MockData>("data-user.json");
const loginStore = mockStore<{ logins: LoginType[] }>("data-login.json");
const permissionGroupMap = new Map(
  dataPermission.permissionGroups.map((group) => [
    String(group.id),
    group.name,
  ]),
);

export async function GET(_request: NextRequest) {
  const { searchParams } = _request.nextUrl;
  const keyword = searchParams.get("name") || searchParams.get("email");
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const permissionGroupId = searchParams.get("permissionGroupId");
  const status = searchParams.get("status");
  await delay();

  let results = dataUser.users;
  if (keyword) {
    const kw = keyword.toLowerCase();
    results = dataUser.users.filter(
      (user) =>
        user.name.toLowerCase().includes(kw) ||
        user.email.toLowerCase().includes(kw),
    );
  }

  if (permissionGroupId) {
    results = results.filter(
      (user) => user.permissionGroupId === permissionGroupId,
    );
  }

  if (status) {
    results = results.filter((user) => user.status === status);
  }
  
  const total = results.length;
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize).map((user) => ({
    ...user,
    permissionGroupName: permissionGroupMap.get(user.permissionGroupId) ?? null,
  }));

  return NextResponse.json({
    data: paged,
    pagination: { page, pageSize, total },
  });
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

  await delay();

  const createdUser: UserType = {
    id: Date.now().toString(),
    name: validation.data.name,
    email: validation.data.email,
    phone: validation.data.phone,
    permissionGroupId: validation.data.permissionGroupId,
    subMerchantScope: validation.data.subMerchantScope,
    assignedSubMerchantsIds: validation.data.assignedSubMerchantsIds ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissionGroupName:
      dataPermission.permissionGroups.find(
        (g) => g.id === validation.data.permissionGroupId,
      )?.name ?? "Unknown",
    assignedSubMerchantCount:
      validation.data.assignedSubMerchantsIds?.length ?? 0,
    status: "active",
  } as UserType;

  await store.update((mock) => ({
    ...mock,
    users: [...mock.users, createdUser],
  }));

  // Auto-create login entry with default password
  const hashedPassword = await bcrypt.hash("111111", 10);
  const loginId = Date.now().toString();

  await loginStore.update((mock) => ({
    ...mock,
    logins: [
      ...mock.logins,
      {
        id: loginId,
        idUser: createdUser.id,
        username: validation.data.email,
        password: hashedPassword,
      },
    ],
  }));

  return NextResponse.json(createdUser, { status: 201 });
}
