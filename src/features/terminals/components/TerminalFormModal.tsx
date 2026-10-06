"use client";

import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
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
  const message = form.fieldError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{detail ? "Cập nhật Terminal" : "Thêm Terminal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.submit} className="mt-4 space-y-4">
          <TerminalIdentityFields values={form.values} change={form.change} detail={detail} />
          <TerminalContactFields values={form.values} change={form.change} />
          {message && <p role="alert" className="text-sm text-danger">{message}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" variant="solid" isLoading={isSubmitting}>Lưu Terminal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
