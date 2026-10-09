"use client";

import { Button } from "@/components/ui/button/Button";
import { KybStepDocuments } from "./KybStepDocuments";
import { KybStepLegal } from "./KybStepLegal";
import { KybStepRepresentative } from "./KybStepRepresentative";
import type { useKybFlow } from "../hooks/use-kyb-flow";
import type { EnterpriseWallet } from "../types";

type Props = {
  flow: ReturnType<typeof useKybFlow>;
  wallet: EnterpriseWallet;
  onRefreshLinks: () => void;
  onCancel?: () => void;
};

function submitLabel(flow: ReturnType<typeof useKybFlow>): string {
  if (!flow.needsOtp) return "Lưu thay đổi";
  return flow.verified ? "Tiếp tục: xác thực OTP và gửi lại" : "Tiếp tục: xác thực OTP";
}

/** The dossier laid out on the page: four groups of fields, then save a draft or go on to the OTP. */
export function KybForm({ flow, wallet, onRefreshLinks, onCancel }: Props) {
  const { form } = flow;
  return (
    <form className="grid gap-6" noValidate onSubmit={flow.goToOtp}>
      <KybStepLegal form={form} walletId={wallet.id} changes={flow.identityChanges} />
      <KybStepRepresentative form={form} changes={flow.identityChanges} />
      <KybStepDocuments
        wallet={wallet}
        control={form.control}
        missing={flow.missing}
        onStagingChange={flow.setStaging}
        onRefreshLinks={onRefreshLinks}
      />
      {flow.serverError && <p role="alert" className="text-sm text-danger">{flow.serverError}</p>}
      <div className="-mx-5 -mb-5 flex flex-wrap items-center justify-end gap-2 rounded-b-xl border-t border-border bg-background px-5 py-3.5">
        {flow.verified && onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        )}
        {wallet.verificationStatus === "DRAFT" && (
          <Button type="button" variant="outline" isLoading={flow.isSaving} onClick={flow.saveDraft}>
            Lưu nháp
          </Button>
        )}
        <Button type="submit" variant="solid" isLoading={flow.isSaving}>{submitLabel(flow)}</Button>
      </div>
    </form>
  );
}
