import {
  Button,
  ComboBox,
  DatePicker,
  Form,
  FormField,
  Input,
} from "@/components/ui";
import React from "react";
import {
  ORDER_SOURCE_OPTIONS,
  ORDER_STATUS_OPTIONS,
} from "../constants/Order.constants";
import { RefreshCw, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { OrderListFilter } from "../types/types";

interface OrderFilterProps {
  onSearch: (value: OrderListFilter) => void;
}
const OrderFilter = ({ onSearch }: OrderFilterProps) => {
  const SOURCE_SELECT = [
    { label: "Tất cả nguồn", value: "" },
    ...ORDER_SOURCE_OPTIONS,
  ];
  const STATUS_SELECT = [
    { label: "Tất cả trạng thái", value: "" },
    ...ORDER_STATUS_OPTIONS,
  ];

  const DEFAULT_FILTER:OrderListFilter = {
    createdFromDate: undefined,
    createdToDate: undefined,
    source: undefined,
    createdBy: undefined,
    status: undefined,
  };
  const form = useForm({
    defaultValues: {
      ...DEFAULT_FILTER,
    },
  });

  const handleReset = () => {
    form.reset(DEFAULT_FILTER);
    onSearch(DEFAULT_FILTER);
  };
 

 
  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((value) => {
            const trimmed = Object.fromEntries(
              Object.entries(value).map(([key, val]) => {
                return [key, typeof val === "string" ? val.trim() : val];
              }),
            );
            onSearch(trimmed);
          })}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            <FormField
              control={form.control}
              name="createdFromDate"
              render={({ field }) => <DatePicker {...field} label="Từ ngày" />}
            />
            <FormField
              control={form.control}
              name="createdToDate"
              render={({ field }) => <DatePicker {...field}  label="Đến ngày" />}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <ComboBox
                  label="Nguồn đơn"
                  {...field}
                  options={SOURCE_SELECT}
                  placeholder="----Chọn trạng thái----"
                />
              )}
            />
            <FormField
              control={form.control}
              name="createdBy"
              render={({ field }) => (
                <Input
                  {...field}
                  label="Người tạo (Sub-user)"
                  placeholder="Tất cả nhân viên"
                />
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <ComboBox
                  {...field}
                  label="Trạng thái"
                  options={STATUS_SELECT}
                  placeholder="----Chọn trạng thái----"
                />
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
    </div>
  );
};

export default OrderFilter;
