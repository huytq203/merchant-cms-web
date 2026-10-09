"use client";

import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge/Badge";
import { formatDate } from "@/lib/utils/helper";
import { WALLET_STATUS_LABELS } from "../constants/status-labels";
import type { EnterpriseWallet } from "../types";
import { kybTimeline } from "../utils/kyb-timeline";
import { businessTypeLabel } from "../utils/merchant-mapper";
import { DetailRow } from "./DetailRow";
import { Notice } from "@/components/page/Notice";
import { MerchantProcessSteps } from "./MerchantProcessSteps";

type Props = {
  wallet: EnterpriseWallet;
  /** Offered for a verified dossier: opens the form to change it (identity changes go back to review). */
  onEdit: () => void;
};

function storedDocuments(wallet: EnterpriseWallet): string {
  const names = [
    wallet.businessLicense ? "Giấy phép ĐKKD" : null,
    wallet.idCardFront && wallet.idCardBack ? "CCCD hai mặt" : null,
    wallet.authorizationLetter ? "Giấy ủy quyền" : null,
  ];
  return names.filter(Boolean).join(", ");
}

/** A dossier that is under review or verified: read only, with the review progress while it is pending. */
export function KybOverview({ wallet, onEdit }: Props) {
  const status = WALLET_STATUS_LABELS[wallet.verificationStatus];
  const steps = kybTimeline(wallet);
  const pending = wallet.verificationStatus === "PENDING_APPROVAL";
  return (
    <section className="grid gap-5" aria-labelledby="kyb-overview-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="kyb-overview-title" className="text-base font-semibold">Hồ sơ KYB</h2>
          <Badge variant={status.tone}>{status.label}</Badge>
          {pending && wallet.updatedAt && (
            <span className="text-xs text-muted-foreground">Gửi lúc {formatDate(wallet.updatedAt)}</span>
          )}
        </div>
        {!pending && <Button type="button" variant="outline" onClick={onEdit}>Cập nhật hồ sơ</Button>}
      </header>
      {pending && (
        <>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">Tiến trình xử lý hồ sơ</h3>
            <MerchantProcessSteps steps={steps} />
          </div>
          <Notice tone="info">
            Trong thời gian chờ, hồ sơ chỉ xem, không thể chỉnh sửa. Nếu bị từ chối, bạn nhận lý do và có thể sửa rồi gửi lại.
          </Notice>
        </>
      )}
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold">Thông tin hồ sơ{pending ? " đã gửi" : ""}</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Loại hình" value={businessTypeLabel(wallet.businessType)} />
          <DetailRow label="Tên pháp nhân" value={wallet.legalName ?? ""} />
          <DetailRow label="Mã số thuế" value={wallet.taxCode ?? ""} />
          <DetailRow label="Người đại diện" value={wallet.legalRepresentativeName ?? ""} />
          <DetailRow
            label="Người quản lý ví"
            value={[wallet.managerName, wallet.managerTitle].filter(Boolean).join(", ")}
          />
          <DetailRow label="Địa chỉ trụ sở" value={wallet.headOfficeAddress ?? ""} />
          <DetailRow label="Giấy tờ đã tải" value={storedDocuments(wallet)} />
          <DetailRow label="Email đăng ký" value={wallet.registeredEmail} />
          <DetailRow label="SĐT nhận thông báo" value={wallet.otpPhone ?? ""} />
        </dl>
      </div>
    </section>
  );
}
