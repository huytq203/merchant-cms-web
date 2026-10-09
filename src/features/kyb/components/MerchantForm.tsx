"use client";

import { Button } from "@/components/ui/button/Button";
import { useMerchantForm } from "../hooks/use-merchant-form";
import type { MerchantProfile } from "../types";
import { businessTypeLabel } from "../utils/merchant-mapper";
import { DetailRow } from "./DetailRow";
import { Notice } from "@/components/page/Notice";
import { MerchantFormFields } from "./MerchantFormFields";

type Props = {
  merchant: MerchantProfile;
  onRefreshLinks: () => void;
};

/** The ĐVCNTT dossier on the page: the owner's KYB data read only, then the fields to fill. */
export function MerchantForm({ merchant, onRefreshLinks }: Props) {
  const merchantForm = useMerchantForm({ merchant });
  const wallet = merchant.enterpriseWallet;
  return (
    <form className="grid gap-6" noValidate onSubmit={merchantForm.sendForApproval}>
      {merchant.status === "REJECTED" && (
        <Notice tone="danger">
          <p className="font-semibold">Hồ sơ ĐVCNTT bị từ chối</p>
          <p>{merchant.rejectedReasonDetail ?? "Không có lý do được ghi nhận"}</p>
        </Notice>
      )}
      <section className="grid gap-3" aria-labelledby="merchant-wallet-title">
        <h3 id="merchant-wallet-title" className="text-sm font-semibold text-foreground">
          Thông tin chủ ví <span className="font-normal text-muted-foreground">(kế thừa từ KYB, chỉ đọc)</span>
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Tên pháp nhân" value={wallet?.legalName ?? ""} />
          <DetailRow label="Mã số thuế" value={wallet?.taxCode ?? ""} />
          <DetailRow label="Người đại diện" value={wallet?.legalRepresentativeName ?? ""} />
          <DetailRow label="Loại doanh nghiệp" value={businessTypeLabel(wallet?.businessType)} />
          <DetailRow label="Tài khoản đăng nhập" value={wallet?.registeredEmail ?? ""} />
        </dl>
      </section>
      <MerchantFormFields
        form={merchantForm.form}
        merchant={merchant}
        disabled={false}
        onStagingChange={merchantForm.setStaging}
        onRefreshLinks={onRefreshLinks}
      />
      {merchantForm.serverError && <p role="alert" className="text-sm text-danger">{merchantForm.serverError}</p>}
      <div className="-mx-5 -mb-5 flex flex-wrap items-center gap-2 rounded-b-xl border-t border-border bg-background px-5 py-3.5">
        <span className="mr-auto text-xs text-muted-foreground">Gửi duyệt xong sẽ không sửa được cho tới khi có kết quả.</span>
        {merchant.status === "DRAFT" && (
          <Button type="button" variant="outline" isLoading={merchantForm.isBusy} onClick={merchantForm.saveDraft}>
            Lưu nháp
          </Button>
        )}
        <Button type="submit" variant="solid" isLoading={merchantForm.isBusy}>Gửi duyệt</Button>
      </div>
    </form>
  );
}
