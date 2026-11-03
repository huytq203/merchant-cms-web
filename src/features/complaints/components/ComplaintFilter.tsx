"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker, Form, FormField, Input, Select } from "@/components/ui";
import { SubMerchantFilterField } from "@/features/sample-data/components/SubMerchantFilterField";
import {
  COMPLAINT_REPORTER_OPTIONS,
  COMPLAINT_STATUS_OPTIONS,
  COMPLAINT_WAITING_ON_OPTIONS,
} from "../constants/Complaint.constants";
import { complaintFilterSchema, type ComplaintFilterValues } from "../schemas/complaint.schema";

interface ComplaintFilterProps {
  onSearch: (values: ComplaintFilterValues) => void;
  defaultValues?: ComplaintFilterValues;
}

const STATUS_SELECT = COMPLAINT_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));

const EMPTY_VALUES: ComplaintFilterValues = {
  keyword: "",
  status: "",
  waitingOn: "",
  reporterType: "",
  subMerchantId: "",
  createdFrom: null,
  createdTo: null,
};

/** The filters the BE list supports; all conditions combine with AND. */
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
      <FilterCard fieldCount={6} actionsInGrid onSubmit={() => void form.handleSubmit(onSearch)()} onClear={handleReset}>
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <Input label="Mã khiếu nại / Mã GD" placeholder="Nhập mã cần tìm" {...field} value={field.value ?? ""} />
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
          name="waitingOn"
          render={({ field }) => (
            <Select label="Chờ phản hồi" placeholder="Tất cả" value={field.value ?? ""} onChange={field.onChange} options={COMPLAINT_WAITING_ON_OPTIONS} />
          )}
        />
        <FormField
          control={form.control}
          name="reporterType"
          render={({ field }) => (
            <Select label="Người gửi" placeholder="Tất cả" value={field.value ?? ""} onChange={field.onChange} options={COMPLAINT_REPORTER_OPTIONS} />
          )}
        />
        <FormField
          control={form.control}
          name="subMerchantId"
          render={({ field }) => <SubMerchantFilterField value={field.value ?? ""} onChange={field.onChange} />}
        />
        <FormField
          control={form.control}
          name="createdFrom"
          render={({ field }) => (
            <DatePicker
              mode="range"
              label="Ngày tạo"
              placeholder="Từ ngày, đến ngày"
              value={field.value ? { from: field.value, to: form.getValues("createdTo") ?? undefined } : undefined}
              onChange={(value) => {
                const range = value && !(value instanceof Date) ? (value as DateRange) : undefined;
                field.onChange(range?.from ?? null);
                form.setValue("createdTo", range?.to ?? null, { shouldValidate: true });
              }}
              error={form.formState.errors.createdTo?.message}
            />
          )}
        />
      </FilterCard>
    </Form>
  );
}
