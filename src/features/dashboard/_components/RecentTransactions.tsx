"use client"
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button/Button";
import { Table } from "@/components/ui";
import { MerchantColumn } from "../columns/Dashboard.column";
import type { RecentTransaction } from "../types/Dashboard.type";

export function RecentTransactions({ rows }: { rows: RecentTransaction[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Giao dịch gần đây</CardTitle>
          <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={<Link href="/transaction" role="link" />}
          >
            Xem tất cả
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Chưa có giao dịch nào gần đây</p>
        ) : (
          <Table columns={MerchantColumn} data={rows} pagination={false} />
        )}
      </CardContent>
    </Card>
  );
}
