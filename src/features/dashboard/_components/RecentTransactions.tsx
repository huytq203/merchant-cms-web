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
import { useHandle } from "../hooks/useHandle";
import { MerchantColumn } from "../columns/Dashboard.column";


export function RecentTransactions() {
  const{data}=useHandle();
  const columns = MerchantColumn
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Giao dịch gần đây</CardTitle>
          <Link href="/transactions">
            <Button variant="link" size="sm">
              Xem tất cả
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="">
        <Table columns={columns} data={data?.data||[]} />
      </CardContent>
    </Card>
  );
}
