"use client";

import { usePathname, useRouter } from "next/navigation";
import { Table } from "@/components/ui/table/Table";
import { escrowLedgerColumns } from "../columns/EscrowColumns";
import type { EscrowLedgerEntry } from "../types";

interface Props {
  rows: EscrowLedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/** The ledger page lives in the URL; the server renders the requested page. */
export function EscrowLedgerTable({ rows, total, page, pageSize }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="max-w-full overflow-x-auto">
      <Table
        data={rows}
        columns={escrowLedgerColumns}
        labels={{ empty: "Chưa có bút toán nào" }}
        pagination={{ total, current: page, pageSize, onChange: (next, size) => router.push(`${pathname}?page=${next}&pageSize=${size}`) }}
      />
    </div>
  );
}
