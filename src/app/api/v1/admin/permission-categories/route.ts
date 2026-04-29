import { NextResponse } from "next/server";
import { getPermissionCatalog } from "@/server/modules/permissions/permission.service";

export async function GET() {
  const categories = await getPermissionCatalog();

  return NextResponse.json({
    data: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      permissions: cat.permissions,
    })),
    pagination: { page: 1, pageSize: categories.length, total: categories.length },
  });
}
