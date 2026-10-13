"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker, Form, FormField, Input, Select } from "@/components/ui";
import { COMPLAINT_SOURCE_OPTIONS, COMPLAINT_STATUS_OPTIONS } from "../constants/Complaint.constants";
import { complaintFilterSchema, type ComplaintFilterValues } from "../schemas/complaint.schema";

interface ComplaintFilterProps {
  onSearch: (values: ComplaintFilterValues) => void;
  defaultValues?: ComplaintFilterValues;
}

const SOURCE_SELECT = COMPLAINT_SOURCE_OPTIONS.map(({ value, label }) => ({ value, label }));
const STATUS_SELECT = COMPLAINT_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));

const EMPTY_VALUES: ComplaintFilterValues = { keyword: "", fromDate: null, toDate: null, source: "", status: "" };

export function ComplaintFilter({ onSearch, defaultValues }: ComplaintFilterProps) {
  const form = useForm<ComplaintFilterValues>({
    resolver: zodResolver(complaintFilterSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const handleReset = () => {
    form.reset(EMPTY_VALUES);
    onSearch(EMPTY_VALUES);
  };

  return (
    <Form {...form}>
      <FilterCard fieldCount={4} onSubmit={() => void form.handleSubmit(onSearch)()} onClear={handleReset}>
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <Input label="Mã khiếu nại / Mã GD" placeholder="Nhập mã cần tìm" {...field} value={field.value ?? ""} />
          )}
        />
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <Select label="Nguồn" placeholder="Tất cả nguồn" value={field.value ?? ""} onChange={field.onChange} options={SOURCE_SELECT} />
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select label="Trạng thái" placeholder="Tất cả trạng thái" value={field.value ?? ""} onChange={field.onChange} options={STATUS_SELECT} />
          )}
        />
        <FormField
          control={form.control}
          name="fromDate"
          render={({ field }) => (
            <DatePicker
              mode="range"
              label="Ngày tạo"
              placeholder="Từ ngày, đến ngày"
              value={field.value ? { from: field.value, to: form.getValues("toDate") ?? undefined } : undefined}
              onChange={(value) => {
                const range = value && !(value instanceof Date) ? (value as DateRange) : undefined;
                field.onChange(range?.from ?? null);
                form.setValue("toDate", range?.to ?? null, { shouldValidate: true });
              }}
              error={form.formState.errors.toDate?.message}
            />
          )}
        />
      </FilterCard>
    </Form>
  );
}
