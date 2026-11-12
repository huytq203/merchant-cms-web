import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasAnyPermission } from "@/features/auth/permissions";
import { CustomerDisplayScreen } from "@/features/customer-display/components/CustomerDisplayScreen";
import { getServerSession } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

/**
 * Màn "Hiển thị cho khách" của một đơn đang chờ, mở ở tab riêng từ danh sách/chi tiết đơn.
 * Cùng quyền với "Làm mới QR" (CREATE_ORDER); quyền sở hữu đơn do route BFF kiểm khi mở màn.
 */
export default async function OrderCustomerDisplayPage({ params }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasAnyPermission(user.permissions, ["CREATE_ORDER"])) return <AccessDenied />;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <CustomerDisplayScreen source={{ kind: "order", id }} />;
}
