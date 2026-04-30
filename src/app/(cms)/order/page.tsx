"use client";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import OrderForm from "@/features/orders/components/OrderForm";

export default function OrderPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý Đơn hàng Tổng hợp
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Theo dõi tất cả giao dịch từ API và Payment Link
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => toast.info("Đang xuất dữ liệu...")}
          >
            Xuất Excel
          </Button>
          <Link href="/order/new">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Tạo Link mới
            </Button>
          </Link>
        </div>
      </div>
      <OrderForm />
    </div>
  );
}
