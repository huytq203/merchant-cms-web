import type { ColumnDef } from "@tanstack/react-table";

export function getIndexValue(page: number, pageSize: number, index: number) {
  return (page - 1) * pageSize + index + 1;
}

interface IndexColumnOptions {
  page: number;
  pageSize: number;
}

export function createIndexColumn<TData>({ page, pageSize }: IndexColumnOptions): ColumnDef<TData> {
  return {
    id: "index",
    size: 10,
    meta: { align: "center" },
    header: () => <span className="whitespace-nowrap">#</span>,
    cell: ({ row }) => <span className="whitespace-nowrap">{getIndexValue(page, pageSize, row.index)}</span>,
    enableSorting: false,

  };
}
