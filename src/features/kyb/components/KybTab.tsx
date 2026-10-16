"use client";

import { useState } from "react";
import { KybSteps } from "./KybSteps";
import { useKybFlow, KYB_STEP_LABELS } from "../hooks/use-kyb-flow";
import type { EnterpriseWallet } from "../types";
import { canEditKyb } from "../utils/kyb-mapper";
import { formatDate } from "@/lib/utils/helper";
import { KybDone } from "./KybDone";
import { KybForm } from "./KybForm";
import { Notice } from "@/components/page/Notice";
import { KybOtpStep } from "./KybOtpStep";
import { KybOverview } from "./KybOverview";

type Props = {
  merchantId: string;
  wallet: EnterpriseWallet;
  canManage: boolean;
  onRefreshLinks: () => void;
};

type FormProps = Omit<Props, "canManage"> & { onSent: (outcome: "sent" | "saved") => void; onCancel?: () => void };

function RejectionNotice({ wallet }: { wallet: EnterpriseWallet }) {
  return (
    <Notice tone="danger">
      <p className="font-semibold">Hồ sơ KYB bị từ chối</p>
      <p>{wallet.kybRejectedReason ?? "Không có lý do được ghi nhận"}</p>
      {wallet.kybRejectedAt && <p className="text-xs">Từ chối lúc {formatDate(wallet.kybRejectedAt)}. Sửa hồ sơ rồi gửi lại.</p>}
    </Notice>
  );
}

function FormNotice({ wallet }: { wallet: EnterpriseWallet }) {
  if (wallet.verificationStatus === "REJECTED") return <RejectionNotice wallet={wallet} />;
  if (wallet.verificationStatus === "VERIFIED") {
    return (
      <Notice tone="warning">
        <b>Hồ sơ đã được xác thực.</b> Đổi tên pháp nhân, mã số thuế hoặc người đại diện sẽ đưa hồ sơ về Chờ duyệt KYB
        và tạm khóa các tính năng ví cho tới khi Flexpay duyệt lại. Các trường khác lưu ngay.
      </Notice>
    );
  }
  return (
    <Notice tone="info">
      <b>Chưa xác thực KYB.</b> Khai báo và tải lên hồ sơ pháp lý, rồi gửi để Flexpay duyệt và kích hoạt ví. Có thể lưu nháp và quay lại sau.
    </Notice>
  );
}

/** One mount per editing session: the form state, staged uploads and OTP live with it. */
function KybFlow({ merchantId, wallet, onRefreshLinks, onSent, onCancel }: FormProps) {
  const flow = useKybFlow({ merchantId, wallet, onSent });
  return (
    <div className="grid gap-5">
      <KybSteps steps={KYB_STEP_LABELS} current={flow.step === "form" ? 0 : 1} />
      {flow.step === "form" && <FormNotice wallet={wallet} />}
      {flow.step === "form"
        ? <KybForm flow={flow} wallet={wallet} onRefreshLinks={onRefreshLinks} onCancel={onCancel} />
        : <KybOtpStep flow={flow} />}
    </div>
  );
}

/** Which view of the KYB dossier fits its status: the form to fill, the OTP, or the read-only overview. */
export function KybTab(props: Props) {
  const { wallet, canManage, ...flowProps } = props;
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) return <KybDone onContinue={() => setSent(false)} />;
  if (!canManage) return <KybOverview wallet={wallet} />;
  const showForm = canEditKyb(wallet) || editing;
  if (!showForm) return <KybOverview wallet={wallet} onEdit={() => setEditing(true)} />;
  return (
    <KybFlow
      {...flowProps}
      wallet={wallet}
      key={wallet.verificationStatus}
      onCancel={() => setEditing(false)}
      onSent={(outcome) => {
        if (outcome === "sent") setSent(true);
        setEditing(false);
      }}
    />
  );
}
