"use client";
import { Button, ComboBox, DatePicker, Form, FormField, Input } from "@/components/ui";
import React from "react";
import { WITHDRAWAL_STATUS_OPTIONS } from "../constants/Withdrawal.constants";
import { RefreshCw, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { WithdrawalListFilter } from "../types/types";

type FilterFormValues = {
  fromDate?: Date;
  toDate?: Date;
  status?: string;
  subMerchantId?: string;
};

interface WithdrawalFilterProps {
  onSearch: (value: WithdrawalListFilter) => void;
}

export function WithdrawalFilter({ onSearch }: WithdrawalFilterProps) {
  const STATUS_SELECT = [
    { label: "Tất cả trạng thái", value: "" },
    ...WITHDRAWAL_STATUS_OPTIONS,
  ];

  const DEFAULT_FORM_VALUES: FilterFormValues = {
    fromDate: undefined,
    toDate: undefined,
    status: "",
    subMerchantId: "",
  };

  const form = useForm<FilterFormValues>({ defaultValues: DEFAULT_FORM_VALUES });

  const handleReset = () => {
    form.reset(DEFAULT_FORM_VALUES);
    onSearch({});
  };

  const handleSubmit = (values: FilterFormValues) => {
    const filter: WithdrawalListFilter = {
      createdFromDate: values.fromDate?.toISOString(),
      createdToDate: values.toDate?.toISOString(),
      status: values.status?.trim() || undefined,
      subMerchantId: values.subMerchantId?.trim() || undefined,
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
            name="subMerchantId"
            render={({ field }) => (
              <Input {...field} label="Sub-merchant" placeholder="Tất cả sub-merchant" />
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
