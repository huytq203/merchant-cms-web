"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Input } from "@/components/ui/input/Input";
import { Notice } from "@/components/page/Notice";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { BANK_OPTIONS, EXPIRY_OPTIONS, PAYMENT_METHOD_OPTIONS } from "../constants/Order.constants";
import { useDuplicateOrder } from "../hooks/use-duplicate-order";
import { useNow } from "../hooks/use-now";
import { useOrderForm } from "../hooks/use-order-form";
import { useTerminalOptions } from "../hooks/use-terminal-options";
import type { OrderFormData } from "../schemas/order.schema";
import { OrderPreview } from "./OrderPreview";

type Props = {
  onCancel: () => void;
  onSubmit: (values: OrderFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  serverErrors: Record<string, string>;
};

const groupDigits = (digits: string) => (digits ? new Intl.NumberFormat("vi-VN").format(Number(digits)) : "");

export function OrderFormBody({ onCancel, onSubmit, isSubmitting, error, serverErrors }: Props) {
  const form = useOrderForm(onSubmit);
  const now = useNow(true);
  const subMerchants = useSubMerchantOptions();
  const [checkedCode, setCheckedCode] = useState("");
  const duplicate = useDuplicateOrder(checkedCode);
  const subs = subMerchants.data ?? [];
  // Left blank, BE uses the only Sub-merchant in scope, or the default one; Terminals follow that choice.
  const subMerchantId =
    form.values.subMerchantId || (subs.length === 1 ? subs[0]!.id : (subs.find((sub) => sub.isDefault)?.id ?? ""));
  const terminals = useTerminalOptions(subMerchantId);
  const terminalOptions = terminals.data ?? [];
  const errors: Record<string, string | undefined> = { ...serverErrors, ...form.errors };
  const amount = Number(form.values.amount);
  const minutes = Number(form.values.expiryMinutes);
  const expiresAt = minutes > 0 ? new Date(now.getTime() + minutes * 60_000) : null;

  return (
    <form onSubmit={form.submit} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogHeader className="mb-0">
        <DialogTitle>Tạo đơn hàng thanh toán</DialogTitle>
        <p className="text-sm text-muted-foreground">Tạo xong, hệ thống sinh mã QR để khách thanh toán.</p>
      </DialogHeader>
      <DialogBody className="-mx-1 space-y-4 px-1 pb-1">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Select
            label="Sub-merchant nhận tiền"
            value={subMerchantId}
            onChange={(value) => form.change("subMerchantId", value)}
            options={subs.map((sub) => ({
              value: sub.id,
              label: `${sub.code} — ${sub.name}${sub.isDefault ? " (mặc định)" : ""}`,
            }))}
            placeholder="Mặc định"
            clearable={false}
            error={errors.subMerchantId}
          />
          <Select
            label="Terminal"
            value={form.values.terminalId}
            onChange={(value) => form.change("terminalId", value)}
            options={terminalOptions}
            placeholder="Không gắn Terminal"
            disabled={terminalOptions.length === 0}
            description={
              !subMerchantId
                ? "Chọn Sub-merchant trước."
                : terminalOptions.length === 0
                  ? "Chưa có Terminal đang hoạt động."
                  : undefined
            }
            error={errors.terminalId}
          />
          <Input
            label="Mã đơn hàng"
            placeholder="Ví dụ: DH0001"
            required
            maxLength={100}
            value={form.values.orderCode}
            onChange={(event) => form.change("orderCode", event.target.value)}
            onBlur={(event) => setCheckedCode(event.target.value)}
            endIcon={
              <button
                type="button"
                onClick={form.generateCode}
                aria-label="Tạo mã đơn tự động"
                title="Tạo mã đơn tự động"
                className="rounded-sm p-1 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Wand2 size={16} aria-hidden="true" />
              </button>
            }
            error={errors.orderCode}
          />
          <Input
            label="Số tiền (VND)"
            placeholder="Ví dụ: 1.500.000"
            required
            inputMode="numeric"
            value={groupDigits(form.values.amount)}
            onChange={(event) => form.change("amount", event.target.value.replace(/\D/g, ""))}
            error={errors.amount}
          />
        </div>
        <div className="grid items-start gap-4 sm:grid-cols-3">
          <Select
            label="Phương thức thanh toán"
            placeholder="Chọn phương thức"
            value={form.values.paymentMethod}
            onChange={(value) => form.change("paymentMethod", value)}
            options={PAYMENT_METHOD_OPTIONS}
            clearable={false}
            error={errors.paymentMethod}
          />
          <Select
            label="Ngân hàng nhận tiền"
            value={form.values.bankCode}
            onChange={(value) => form.change("bankCode", value)}
            options={BANK_OPTIONS}
            placeholder="Chọn ngân hàng"
            error={errors.bankCode}
          />
          <Select
            label="Hết hạn sau"
            placeholder="Chọn thời gian"
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
        <OrderPreview amount={amount} expiresAt={expiresAt} />
        {duplicate ? (
          <Notice tone="warning">
            <b>Mã này đã có.</b> Đơn {duplicate.orderCode} chưa thanh toán, tạo lại sẽ cập nhật đơn đó và cấp mã QR mới.
            Đơn đã thanh toán thì không sửa được.
          </Notice>
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </DialogBody>
      <DialogFooter className="items-center border-t border-border pt-4">
        <p className="mr-auto text-xs text-muted-foreground">
          Phương thức chưa bật cho Sub-merchant sẽ bị từ chối khi tạo.
        </p>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant="solid" isLoading={isSubmitting}>
          Tạo đơn hàng
        </Button>
      </DialogFooter>
    </form>
  );
}
