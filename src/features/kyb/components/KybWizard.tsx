"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import {
  WIZARD_STEP_LABELS,
  WIZARD_STEP_ORDER,
  useKybWizard,
} from "../hooks/use-kyb-wizard";
import type { EnterpriseWallet } from "../types";
import { KybDone } from "./KybDone";
import { KybSteps } from "./KybSteps";
import { KybWizardForm } from "./KybWizardForm";
import { KybWizardReview } from "./KybWizardReview";

type Props = {
  merchantId: string;
  wallet: EnterpriseWallet;
  onClose: () => void;
  onRefreshLinks: () => void;
};

export function KybWizard({ merchantId, wallet, onClose, onRefreshLinks }: Props) {
  const wizard = useKybWizard({ merchantId, wallet });
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác thực KYB</DialogTitle>
        </DialogHeader>
        <div className="mt-4 grid gap-6">
          <KybSteps
            steps={WIZARD_STEP_LABELS}
            current={WIZARD_STEP_ORDER.indexOf(wizard.step)}
          />
          {wizard.step === "form" && (
            <KybWizardForm wizard={wizard} wallet={wallet} onRefreshLinks={onRefreshLinks} />
          )}
          {wizard.step === "review" && <KybWizardReview wizard={wizard} />}
          {wizard.step === "done" && <KybDone onReview={onClose} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
