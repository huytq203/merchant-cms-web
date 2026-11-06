"use client";

import { useState } from "react";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultCard } from "@/components/page/ResultCard";
import { Button } from "@/components/ui/button/Button";
import { QueryListState } from "@/features/sample-data/components/QueryListState";
import { describeComplaintError, downloadComplaintsCsv } from "../complaint-api";
import { complaintQueries } from "../complaint-queries";
import { useComplaintListNavigation } from "../hooks/use-complaint-list-navigation";
import type { ComplaintFilterValues } from "../schemas/complaint.schema";
import type { Complaint, ComplaintListFilter } from "../types/types";
import { filterToFormValues, formValuesToFilter } from "../utils/complaint-filter";
import { ComplaintDetail } from "./ComplaintDetail";
import { ComplaintCreateDialog } from "./ComplaintCreateDialog";
import { ComplaintFilter } from "./ComplaintFilter";
import { ComplaintTable } from "./ComplaintTable";

/** Portal permissions: VIEW_DISPUTE opens the page and the export, the others show their actions. */
export type ComplaintAbilities = { canReply: boolean; canCreate: boolean };

type Props = {
  filter: ComplaintListFilter;
  abilities: ComplaintAbilities;
};

export function ComplaintsContainer({ filter, abilities }: Props) {
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [creating, setCreating] = useState(false);
  const navigation = useComplaintListNavigation(filter);
  const list = useQuery(complaintQueries.list(filter));
  const exportCsv = useMutation({
    mutationFn: () => downloadComplaintsCsv(filter),
    onError: (error) => toast.error(describeComplaintError(error)),
  });

  const handleSearch = (values: ComplaintFilterValues) => {
    navigation.search(formValuesToFilter(values, filter.pageSize));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/complaint")}
        description="Theo dõi và xử lý khiếu nại, tra soát giao dịch"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() => exportCsv.mutate()}
              isLoading={exportCsv.isPending}
            >
              Xuất file
            </Button>
            {abilities.canCreate && (
              <Button type="button" variant="solid" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
                Tạo khiếu nại mới
              </Button>
            )}
          </div>
        }
      />
      <ComplaintFilter
        key={JSON.stringify(filter)}
        defaultValues={filterToFormValues(filter)}
        onSearch={handleSearch}
      />
      <ResultCard>
        <h2 className="px-4 pb-1 pt-4 font-semibold">
          Kết quả
          {list.data ? <span className="ml-2 text-sm font-normal text-muted-foreground">{list.data.total} khiếu nại</span> : null}
        </h2>
        <div className="p-4 pt-2">
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
        </div>
      </ResultCard>
      <ComplaintDetail
        complaint={selected}
        open={selected !== null}
        canReply={abilities.canReply}
        onOpenChange={(open) => !open && setSelected(null)}
      />
      {abilities.canCreate && (
        <ComplaintCreateDialog open={creating} onOpenChange={setCreating} onCreated={setSelected} />
      )}
    </div>
  );
}
