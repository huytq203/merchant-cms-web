import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import { getServerSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getServerSession();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Tổng quan
          </p>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight">
            Xin chào, {user?.username ?? "bạn"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chỉ số vận hành theo thời gian thực của thương gia.
          </p>
        </div>
      </header>

      <section
        aria-label="Chỉ số chính"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {SUMMARY_CARDS.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardDescription>{c.title}</CardDescription>
              <CardTitle className="text-2xl">{c.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>
              Nối với API BE để hiển thị dữ liệu thật.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Chưa có dữ liệu hiển thị.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
            <CardDescription>Nhắc nhanh cho đội vận hành.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Khu vực dành cho widget tuỳ biến theo feature.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const SUMMARY_CARDS = [
  { title: "Đơn hàng hôm nay", value: "—", hint: "Kết nối /orders/summary" },
  { title: "Doanh thu", value: "—", hint: "Kết nối /revenue/today" },
  { title: "Khách hàng mới", value: "—", hint: "Kết nối /customers/new" },
  { title: "Tồn kho cảnh báo", value: "—", hint: "Kết nối /inventory/alerts" },
] as const;
