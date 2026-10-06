"use client";

import { Button } from "@/components/ui/button/Button";
import { DialogFooter } from "@/components/ui/dialog/Dialog";
import type { useKybWizard } from "../hooks/use-kyb-wizard";
import type { EnterpriseWallet } from "../types";
import { KybStepDocuments } from "./KybStepDocuments";
import { KybStepLegal } from "./KybStepLegal";
import { KybStepRepresentative } from "./KybStepRepresentative";

type Props = {
  wizard: ReturnType<typeof useKybWizard>;
  wallet: EnterpriseWallet;
  onRefreshLinks: () => void;
};

export function KybWizardForm({ wizard, wallet, onRefreshLinks }: Props) {
  const { form } = wizard;
  return (
    <form className="grid gap-6" noValidate onSubmit={wizard.goToReview}>
      <KybStepLegal form={form} />
      <KybStepRepresentative form={form} />
      <KybStepDocuments
        wallet={wallet}
        control={form.control}
        missing={wizard.missing}
        onStagingChange={wizard.setStaging}
        onRefreshLinks={onRefreshLinks}
      />
      {wizard.serverError && (
        <p role="alert" className="text-sm text-danger">{wizard.serverError}</p>
      )}
      <DialogFooter>
        {wallet.verificationStatus === "DRAFT" && (
          <Button type="button" variant="outline" isLoading={wizard.isSaving} onClick={wizard.saveDraft}>
            Lưu nháp
          </Button>
        )}
        <Button type="submit" variant="solid" isLoading={wizard.isSaving}>
          Tiếp tục
        </Button>
      </DialogFooter>
    </form>
  );
}
