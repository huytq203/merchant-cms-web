import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { registrationConditions } from "../utils/merchant-mapper";
import type { MerchantProfile } from "../types";

type Props = { merchant: MerchantProfile };

type ConditionProps = { state: "met" | "waiting" | "unmet"; label: string; hint?: string; href?: string; action?: string };

function Condition({ state, label, hint, href, action }: ConditionProps) {
  const Icon = state === "met" ? CheckCircle2 : state === "waiting" ? Clock : Circle;
  return (
    <li className={cn("flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm", state === "met" ? "border-success/30 bg-success/5" : "border-border")}>
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", state === "met" ? "text-success" : state === "waiting" ? "text-warning" : "text-muted-foreground")}
        aria-hidden
      />
      <div className="grid gap-0.5">
        <span className={state === "met" ? "font-medium text-foreground" : "font-medium text-foreground"}>{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        {href && action && <Link href={href} className="text-xs font-semibold text-primary underline underline-offset-4">{action}</Link>}
      </div>
      <span className="sr-only">{state === "met" ? "(đã đạt)" : "(chưa đạt)"}</span>
    </li>
  );
}

function kybCondition(merchant: MerchantProfile): ConditionProps {
  const status = merchant.enterpriseWallet?.verificationStatus;
  if (status === "VERIFIED") return { state: "met", label: "Đã xác thực KYB", hint: "Ví đang hoạt động" };
  if (status === "PENDING_APPROVAL") return { state: "waiting", label: "KYB chưa xác thực", hint: "Đang chờ Flexpay duyệt" };
  if (status === "REJECTED") return { state: "unmet", label: "KYB chưa xác thực", hint: "Hồ sơ bị từ chối, cần sửa và gửi lại" };
  return { state: "unmet", label: "KYB chưa xác thực", hint: "Chưa gửi hồ sơ KYB" };
}

/** What the ĐVCNTT form needs before it opens: a verified KYB and a linked bank account. */
export function MerchantConditions({ merchant }: Props) {
  const { bankLinked } = registrationConditions(merchant);
  return (
    <ul className="grid gap-2 sm:grid-cols-2" aria-label="Điều kiện đăng ký">
      <Condition {...kybCondition(merchant)} />
      {bankLinked
        ? <Condition state="met" label="Đã liên kết ngân hàng" />
        : <Condition state="unmet" label="Chưa liên kết ngân hàng" href="/bank-accounts" action="Liên kết ngân hàng" />}
    </ul>
  );
}
