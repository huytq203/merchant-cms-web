"use client";

import { Notice } from "@/components/page/Notice";
import { MerchantConditions } from "./MerchantConditions";
import { MerchantForm } from "./MerchantForm";
import { MerchantOverview } from "./MerchantOverview";
import type { MerchantProfile } from "../types";
import { canEditMerchant, registrationConditions } from "../utils/merchant-mapper";

type Props = {
  merchant: MerchantProfile;
  canManage: boolean;
  onRefreshLinks: () => void;
};

/** Register as a payment acceptor: blocked until KYB and bank are done, then the form, then read only. */
export function MerchantTab({ merchant, canManage, onRefreshLinks }: Props) {
  if (!canManage || !canEditMerchant(merchant)) return <MerchantOverview merchant={merchant} />;
  const { kybVerified, bankLinked } = registrationConditions(merchant);
  const ready = kybVerified && bankLinked;
  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        Đăng ký để ví doanh nghiệp trở thành <b className="text-foreground">đơn vị chấp nhận thanh toán (ĐVCNTT)</b>.
        Sau khi Flexpay duyệt, hệ thống tự sinh một Sub-merchant mặc định.
      </p>
      <MerchantConditions merchant={merchant} />
      {ready
        ? <MerchantForm merchant={merchant} onRefreshLinks={onRefreshLinks} />
        : (
          <Notice tone="warning">
            <b>Chưa đủ điều kiện đăng ký.</b> Hoàn tất hai điều kiện trên rồi quay lại. Biểu mẫu sẽ mở ngay khi cả hai đạt.
          </Notice>
        )}
    </div>
  );
}
