"use client";

import { useMemo } from "react";
import { Table } from "@/components/ui/table/Table";
import { getTerminalColumns } from "../columns/TerminalColumn";
import type { TerminalRow } from "../types";

type Props = {
  rows: TerminalRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (row: TerminalRow) => void;
  onEdit: (row: TerminalRow) => void;
  onLock: (row: TerminalRow) => void;
  onUnlock: (row: TerminalRow) => void;
};

export function TerminalTable(props: Props) {
  const columns = useMemo(() => getTerminalColumns(props), [props]);
  return (
    <Table
      data={props.rows}
      columns={columns}
      labels={{ empty: "Không có Terminal" }}
      pagination={{ total: props.total, current: props.page, pageSize: props.pageSize, onChange: props.onPageChange }}
    />
  );
}
