"use client";
import { Button, ComboBox, DatePicker, Form, FormField } from "@/components/ui";
import React from "react";
import { COMPLAINT_SOURCE_OPTIONS, COMPLAINT_STATUS_OPTIONS } from "../constants/Complaint.constants";
import { RefreshCw, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { ComplaintListFilter } from "../types/types";

type FilterFormValues = {
  fromDate?: Date;
  toDate?: Date;
  source?: string;
  status?: string;
};

interface ComplaintFilterProps {
  onSearch: (value: ComplaintListFilter) => void;
}

export function ComplaintFilter({ onSearch }: ComplaintFilterProps) {
  const SOURCE_SELECT = [
    { label: "Tất cả nguồn", value: "" },
    ...COMPLAINT_SOURCE_OPTIONS,
  ];
  const STATUS_SELECT = [
    { label: "Tất cả trạng thái", value: "" },
    ...COMPLAINT_STATUS_OPTIONS,
  ];

  const DEFAULT_FORM_VALUES: FilterFormValues = {
    fromDate: undefined,
    toDate: undefined,
    source: "",
    status: "",
  };

  const form = useForm<FilterFormValues>({ defaultValues: DEFAULT_FORM_VALUES });

  const handleReset = () => {
    form.reset(DEFAULT_FORM_VALUES);
    onSearch({});
  };

  const handleSubmit = (values: FilterFormValues) => {
    const filter: ComplaintListFilter = {
      createdFromDate: values.fromDate?.toISOString(),
      createdToDate: values.toDate?.toISOString(),
      source: values.source?.trim() || undefined,
      status: values.status?.trim() || undefined,
    };
    onSearch(filter);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
          <FormField
            control={form.control}
            name="fromDate"
            render={({ field }) => (
              <DatePicker label="Từ ngày" value={field.value} onChange={field.onChange} />
            )}
          />
          <FormField
            control={form.control}
            name="toDate"
            render={({ field }) => (
              <DatePicker label="Đến ngày" value={field.value} onChange={field.onChange} />
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <ComboBox label="Nguồn" {...field} options={SOURCE_SELECT} placeholder="----Chọn nguồn----" />
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <ComboBox label="Trạng thái" {...field} options={STATUS_SELECT} placeholder="----Chọn trạng thái----" />
            )}
          />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button
            type="reset"
            variant="outline"
            onClick={handleReset}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Xóa bộ lọc
          </Button>
          <Button type="submit" leftIcon={<Search className="h-4 w-4" />}>
            Tìm kiếm
          </Button>
        </div>
      </form>
    </Form>
  );
}
