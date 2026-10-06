"use client";

import { Button } from "@/components/ui/button/Button";
import { DialogFooter } from "@/components/ui/dialog/Dialog";
import type { useKybWizard } from "../hooks/use-kyb-wizard";
import { KybReview } from "./KybReview";

type Props = { wizard: ReturnType<typeof useKybWizard> };

export function KybWizardReview({ wizard }: Props) {
  return (
    <div className="grid gap-4">
      <KybReview values={wizard.form.getValues()} />
      {wizard.serverError && (
        <p role="alert" className="text-sm text-danger">{wizard.serverError}</p>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={wizard.backToForm}>
          Quay lại chỉnh sửa
        </Button>
        <Button type="button" variant="solid" isLoading={wizard.isSubmitting} onClick={wizard.confirmSubmit}>
          Gửi yêu cầu xác thực KYB
        </Button>
      </DialogFooter>
    </div>
  );
}
