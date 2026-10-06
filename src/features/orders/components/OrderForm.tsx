"use client";

import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { formatAmount } from "@/lib/utils/helper";
import { BANK_OPTIONS, EXPIRY_OPTIONS, PAYMENT_METHOD_OPTIONS } from "../constants/Order.constants";
import { useOrderForm } from "../hooks/use-order-form";
import type { OrderFormData } from "../schemas/order.schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OrderFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  serverErrors: Record<string, string>;
};

export function OrderForm({ open, onOpenChange, onSubmit, isSubmitting, error, serverErrors }: Props) {
  const form = useOrderForm(onSubmit);
  const subMerchants = useSubMerchantOptions();
  const subMerchantOptions = subMerchants.data?.map((item) => ({
    value: item.id,
    label: `${item.code} — ${item.name}`,
  })) ?? [];
  const errors: Record<string, string | undefined> = { ...serverErrors, ...form.errors };
  const amount = Number(form.values.amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo đơn hàng thanh toán</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.submit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Sub-merchant nhận tiền"
              value={form.values.subMerchantId}
              onChange={(value) => form.change("subMerchantId", value)}
              options={subMerchantOptions}
              placeholder="Mặc định"
              error={errors.subMerchantId}
            />
            <Select
              label="Ngân hàng nhận tiền"
              value={form.values.bankCode}
              onChange={(value) => form.change("bankCode", value)}
              options={BANK_OPTIONS}
              placeholder="Chọn ngân hàng"
              error={errors.bankCode}
            />
            <Input
              label="Mã đơn hàng"
              placeholder="Ví dụ: DH0001"
              required
              maxLength={100}
              value={form.values.orderCode}
              onChange={(event) => form.change("orderCode", event.target.value)}
              error={errors.orderCode}
            />
            <Input
              label="Số tiền (VND)"
              placeholder="Nhập số tiền (VND)"
              required
              inputMode="numeric"
              value={form.values.amount}
              onChange={(event) => form.change("amount", event.target.value.replace(/\D/g, ""))}
              description={amount > 0 ? formatAmount(amount) : undefined}
              error={errors.amount}
            />
            <Select
              label="Phương thức thanh toán"
              placeholder="Chọn phương thức thanh toán"
              value={form.values.paymentMethod}
              onChange={(value) => form.change("paymentMethod", value)}
              options={PAYMENT_METHOD_OPTIONS}
              clearable={false}
              error={errors.paymentMethod}
            />
            <Select
              label="Hết hạn sau"
              placeholder="Chọn thời gian hết hạn"
              value={form.values.expiryMinutes}
              onChange={(value) => form.change("expiryMinutes", value)}
              options={EXPIRY_OPTIONS}
              clearable={false}
              error={errors.expiryMinutes}
            />
          </div>
          <Input
            label="Nội dung thanh toán"
            placeholder="Ví dụ: Thanh toán đơn hàng DH0001"
            maxLength={500}
            value={form.values.orderDescription}
            onChange={(event) => form.change("orderDescription", event.target.value)}
            error={errors.orderDescription}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="solid" isLoading={isSubmitting}>
              Tạo đơn hàng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
