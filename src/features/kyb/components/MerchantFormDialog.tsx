"use client";

import { Button } from "@/components/ui/button/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import { useMerchantForm } from "../hooks/use-merchant-form";
import type { MerchantProfile } from "../types";
import { registrationConditions } from "../utils/merchant-mapper";
import { DetailRow } from "./DetailRow";
import { MerchantConditions } from "./MerchantConditions";
import { MerchantFormFields } from "./MerchantFormFields";

type Props = {
  merchant: MerchantProfile;
  onClose: () => void;
  onRefreshLinks: () => void;
};

export function MerchantFormDialog({ merchant, onClose, onRefreshLinks }: Props) {
  const merchantForm = useMerchantForm({ merchant, onSubmitted: onClose });
  const conditions = registrationConditions(merchant);
  const locked = !(conditions.kybVerified && conditions.bankLinked);
  const wallet = merchant.enterpriseWallet;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký ĐVCNTT</DialogTitle>
        </DialogHeader>
        <form className="mt-4 grid gap-6" noValidate onSubmit={merchantForm.sendForApproval}>
          <MerchantConditions merchant={merchant} />
          <section className="grid gap-3" aria-labelledby="merchant-wallet-title">
            <h3 id="merchant-wallet-title" className="text-sm font-semibold text-foreground">
              Thông tin chủ ví (kế thừa từ KYB, chỉ đọc)
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Tên pháp nhân" value={wallet?.legalName ?? ""} />
              <DetailRow label="Người đại diện" value={wallet?.legalRepresentativeName ?? ""} />
              <DetailRow label="Email đăng nhập" value={wallet?.registeredEmail ?? ""} />
            </dl>
          </section>
          <MerchantFormFields
            form={merchantForm.form}
            merchant={merchant}
            disabled={locked}
            onStagingChange={merchantForm.setStaging}
            onRefreshLinks={onRefreshLinks}
          />
          {merchantForm.serverError && (
            <p role="alert" className="text-sm text-danger">{merchantForm.serverError}</p>
          )}
          <DialogFooter>
            {merchant.status === "DRAFT" && (
              <Button
                type="button"
                variant="outline"
                disabled={locked}
                isLoading={merchantForm.isBusy}
                onClick={merchantForm.saveDraft}
              >
                Lưu nháp
              </Button>
            )}
            <Button type="submit" variant="solid" disabled={locked} isLoading={merchantForm.isBusy}>
              Gửi duyệt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
