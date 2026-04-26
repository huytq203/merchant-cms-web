import { NextRequest, NextResponse } from "next/server";
import dataUser from "@/mock/data-user.json";
import dataPermission from "@/mock/data-permission.json";
import { mockStore } from "@/lib/mock/mock-store";

interface UserType {
    id: string;
    name: string;
    email: string;
    phone: number;
    permissionGroupId: string|number;
    assignedSubMerchants: string[];
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'inactive';
}
type MockData = { users: UserType[] };

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));
const store = mockStore<MockData>("data-user.json");
const permissionGroupMap = new Map(
  dataPermission.permissionGroups.map((group) => [String(group.id), group.name])
);

export async function GET(_request: NextRequest) {
  const { searchParams } = _request.nextUrl;
  const keyword = searchParams.get("name") || searchParams.get("email");
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;

  await delay();

  let results = dataUser.users;
  if (keyword) {
    const kw = keyword.toLowerCase();
    results = dataUser.users.filter(
      (user) =>
        user.name.toLowerCase().includes(kw) ||
        user.email.toLowerCase().includes(kw)
    );
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize).map((user) => ({
    ...user,
    permissionGroupName: permissionGroupMap.get(user.permissionGroupId) ?? null,
  }));

  return NextResponse.json({ data: paged, pagination: { page, pageSize, total } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await delay();

    const createdUser: UserType = {
        id: Date.now().toString(),
        name: body.name,
        email: body.email,
        phone: body.phone,
        permissionGroupId: body.permissionGroupId,
        assignedSubMerchants: body.assignedSubMerchants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: body.status,
    }
    await store.update((mock)=>({
        ...mock,
        users: [...mock.users, createdUser]
    }))
    return NextResponse.json(createdUser, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

