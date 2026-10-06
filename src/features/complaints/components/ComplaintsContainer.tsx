"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button/Button";
import { QueryListState } from "@/features/sample-data/components/QueryListState";
import { complaintQueries } from "../complaint-queries";
import { useComplaintListNavigation } from "../hooks/use-complaint-list-navigation";
import { useComplaintCreate } from "../hooks/use-complaint-create";
import type { ComplaintFilterValues } from "../schemas/complaint.schema";
import type { Complaint, ComplaintListFilter } from "../types/types";
import { filterToFormValues, formValuesToFilter } from "../utils/complaint-filter";
import { ComplaintDetail } from "./ComplaintDetail";
import { ComplaintCreateDialog } from "./ComplaintCreateDialog";
import { ComplaintFilter } from "./ComplaintFilter";
import { ComplaintTable } from "./ComplaintTable";

type Props = {
  filter: ComplaintListFilter;
  abilities: { canReply: boolean; canCreate: boolean };
};

export function ComplaintsContainer({ filter, abilities }: Props) {
  const [selected, setSelected] = useState<Complaint | null>(null);
  const navigation = useComplaintListNavigation(filter);
  const create = useComplaintCreate();
  const list = useQuery(complaintQueries.list(filter));

  const handleSearch = (values: ComplaintFilterValues) => {
    navigation.search(formValuesToFilter(values, filter.pageSize));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Khiếu nại</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Theo dõi và xử lý khiếu nại từ các nguồn</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            onClick={() => toast.info("Chức năng xuất Excel chưa được hỗ trợ")}
          >
            Tải Excel
          </Button>
          {abilities.canCreate && (
            <Button type="button" variant="solid" leftIcon={<Plus className="h-4 w-4" />} onClick={() => create.setOpen(true)}>
              Tạo khiếu nại mới
            </Button>
          )}
        </div>
      </header>
      <section className="rounded-xl border bg-card p-4" aria-label="Bộ lọc tìm kiếm">
        <ComplaintFilter
          key={JSON.stringify(filter)}
          defaultValues={filterToFormValues(filter)}
          onSearch={handleSearch}
        />
      </section>
      <section className="rounded-xl border bg-card p-4" aria-label="Kết quả tìm kiếm">
        <h2 className="mb-3 font-semibold">Kết quả {list.data ? `(${list.data.total} khiếu nại)` : ""}</h2>
        <QueryListState query={list} emptyText="Không tìm thấy khiếu nại nào phù hợp">
          {(data) => (
            <ComplaintTable
              rows={data.rows}
              total={data.total}
              page={filter.page}
              pageSize={filter.pageSize}
              onPageChange={navigation.changePage}
              onViewDetail={setSelected}
            />
          )}
        </QueryListState>
      </section>
      <ComplaintDetail
        complaint={selected}
        open={selected !== null}
        canReply={abilities.canReply}
        onOpenChange={(open) => !open && setSelected(null)}
      />
      {abilities.canCreate && (
        <ComplaintCreateDialog open={create.open} onOpenChange={create.setOpen} onSubmit={create.submit} />
      )}
    </div>
  );
}
