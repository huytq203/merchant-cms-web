import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(150, "Tên tối đa 150 ký tự"),
  phone: z
    .string()
    .max(20, "Số điện thoại tối đa 20 ký tự")
    .regex(/^[0-9+\-\s()]*$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized", success: false }, { status: 401 });
  }

  const body = await request.json();
  const validation = updateProfileSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Dữ liệu không hợp lệ",
        success: false,
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { name, phone } = validation.data;

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name,
      phone: phone || null,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Cập nhật thông tin thành công",
    data: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
