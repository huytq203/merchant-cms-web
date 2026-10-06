"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { reasonBodySchema } from "@/lib/schemas/reason";
import type { TerminalRow } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: TerminalRow | null;
  action: "lock" | "unlock";
  onConfirm: (reason: string) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
};

export function TerminalLockModal({ open, onOpenChange, target, action, onConfirm, isSubmitting, error }: Props) {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const close = (next: boolean) => {
    if (!next) {
      setReason("");
      setValidationError(null);
    }
    onOpenChange(next);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = reasonBodySchema.safeParse({ reason });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Lý do không hợp lệ");
      return;
    }
    void onConfirm(parsed.data.reason);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === "lock" ? "Khóa Terminal" : "Mở khóa Terminal"}</DialogTitle>
        </DialogHeader>
        <p className="mt-3 text-sm text-muted-foreground">{target?.tid} · {target?.name}</p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Textarea
            label="Lý do"
            placeholder="Nhập lý do (10–500 ký tự)"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            error={validationError ?? undefined}
          />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)}>Hủy</Button>
            <Button
              type="submit"
              variant={action === "lock" ? "danger" : "solid"}
              isLoading={isSubmitting}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
