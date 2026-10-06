"use client";

import { AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { WALLET_STATUS_LABELS } from "../constants/status-labels";
import type { EnterpriseWallet } from "../types";
import { canEditKyb, maskIdNumber } from "../utils/kyb-mapper";
import { DetailRow } from "./DetailRow";
import { formatDate } from "@/lib/utils/helper";

type Props = {
  wallet: EnterpriseWallet;
  onOpenWizard: () => void;
};

function RejectionNotice({ wallet }: { wallet: EnterpriseWallet }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger" role="alert">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">Hồ sơ KYB bị từ chối</p>
        <p>{wallet.kybRejectedReason ?? "Không có lý do được ghi nhận"}</p>
        {wallet.kybRejectedAt && (
          <p className="text-xs">Lúc {formatDate(wallet.kybRejectedAt)}</p>
        )}
      </div>
    </div>
  );
}

export function KybProgressCard({ wallet, onOpenWizard }: Props) {
  const status = WALLET_STATUS_LABELS[wallet.verificationStatus];
  const editable = canEditKyb(wallet);
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-background p-4" aria-labelledby="kyb-card-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="kyb-card-title" className="text-base font-semibold">Xác thực KYB</h2>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>
        {editable && (
          <Button type="button" variant="solid" onClick={onOpenWizard}>
            {wallet.verificationStatus === "REJECTED" ? "Chỉnh sửa và gửi lại" : "Khai báo hồ sơ"}
          </Button>
        )}
      </header>
      {wallet.verificationStatus === "REJECTED" && <RejectionNotice wallet={wallet} />}
      {wallet.verificationStatus === "PENDING_APPROVAL" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Clock className="size-4" aria-hidden />
          Đang chờ duyệt. Hồ sơ chỉ xem, không thể chỉnh sửa trong thời gian này.
        </p>
      )}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DetailRow label="Tên pháp nhân" value={wallet.legalName ?? ""} />
        <DetailRow label="Mã số thuế" value={maskIdNumber(wallet.taxCode ?? "")} />
        <DetailRow label="Email đăng ký" value={wallet.registeredEmail} />
        <DetailRow label="Người đại diện" value={wallet.legalRepresentativeName ?? ""} />
        <DetailRow label="Địa chỉ trụ sở" value={wallet.headOfficeAddress ?? ""} />
        <DetailRow label="Liên kết ngân hàng" value={wallet.bankLinkStatus === "BANK_LINKED" ? "Đã liên kết" : "Chưa liên kết"} />
      </dl>
    </section>
  );
}
