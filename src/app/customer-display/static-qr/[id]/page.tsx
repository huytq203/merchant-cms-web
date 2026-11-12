import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { hasAnyPermission } from "@/features/auth/permissions";
import { CustomerDisplayScreen } from "@/features/customer-display/components/CustomerDisplayScreen";
import { getServerSession } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

/** Màn hiển thị mã QR tĩnh của quầy: hiện mã mãi, mỗi lần khách trả thì báo thành công 5 giây rồi quay lại mã. */
export default async function StaticQrCustomerDisplayPage({ params }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasAnyPermission(user.permissions, PERMISSION_GATES.staticQrDisplay)) return <AccessDenied />;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <CustomerDisplayScreen source={{ kind: "static-qr", id }} />;
}
