"use client";

import { FormModal } from "@/components/modal/FormModal";
import { useTerminalForm } from "../hooks/use-terminal-form";
import type { TerminalFormValues } from "../schemas";
import type { TerminalDetail } from "../types";
import { TerminalContactFields, TerminalIdentityFields } from "./TerminalFormFields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail?: TerminalDetail | null;
  onSubmit: (values: TerminalFormValues) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
};

export function TerminalFormModal({ open, onOpenChange, detail, onSubmit, isSubmitting, error }: Props) {
  const form = useTerminalForm(detail, onSubmit);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={detail ? "Sửa Terminal" : "Thêm Terminal"}
      description={detail ? detail.tid : "Mã Terminal do hệ thống cấp sau khi tạo."}
      submitLabel={detail ? "Lưu thay đổi" : "Thêm Terminal"}
      isSubmitting={isSubmitting}
      error={error}
      onSubmit={() => form.submit()}
    >
      <div className="flex flex-col gap-6">
        <TerminalIdentityFields values={form.values} errors={form.errors} change={form.change} detail={detail} />
        <TerminalContactFields values={form.values} errors={form.errors} change={form.change} />
      </div>
    </FormModal>
  );
}
