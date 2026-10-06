import { CheckCircle2, Circle } from "lucide-react";
import { registrationConditions } from "../utils/merchant-mapper";
import type { MerchantProfile } from "../types";

type Props = { merchant: MerchantProfile };

function Condition({ met, label }: { met: boolean; label: string }) {
  const Icon = met ? CheckCircle2 : Circle;
  return (
    <li className="flex items-center gap-2 text-sm">
      <Icon className={met ? "size-4 text-success" : "size-4 text-muted-foreground"} aria-hidden />
      <span className={met ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className="sr-only">{met ? "(đã đạt)" : "(chưa đạt)"}</span>
    </li>
  );
}

/** Conditions the ĐVCNTT form can verify from the wallet embedded in the merchant. */
export function MerchantConditions({ merchant }: Props) {
  const { kybVerified, bankLinked } = registrationConditions(merchant);
  const ready = kybVerified && bankLinked;
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm text-muted-foreground">
        Điều kiện đăng ký ĐVCNTT: ví đã xác thực KYB và đã liên kết tài khoản ngân hàng.
      </p>
      <ul className="flex flex-wrap gap-x-6 gap-y-1" aria-label="Điều kiện đăng ký">
        <Condition met={kybVerified} label="Đã xác thực KYB" />
        <Condition met={bankLinked} label="Đã liên kết ngân hàng" />
      </ul>
      {!ready && (
        <p role="alert" className="text-sm text-warning">
          Chưa đủ điều kiện nên biểu mẫu đang bị khoá.
        </p>
      )}
    </div>
  );
}
