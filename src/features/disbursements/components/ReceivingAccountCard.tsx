"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import type { ReceivingAccount } from "../types/types";

/** Sao chép vào clipboard; trình duyệt chặn (không có quyền/không an toàn) thì báo không sao chép được. */
function CopyButton({ label, value }: { label: string; value: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2_000);
  };
  return (
    <Button type="button" variant="ghost" size="sm" aria-label={`Sao chép ${label}`} onClick={() => void copy()}>
      {state === "done" ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span className="text-xs">{state === "done" ? "Đã sao chép" : state === "failed" ? "Không sao chép được" : "Sao chép"}</span>
    </Button>
  );
}

function Line({ label, value, copyLabel }: { label: string; value: string; copyLabel: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 first:border-t-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1 font-medium">
        <span>{value}</span>
        <CopyButton label={copyLabel} value={value} />
      </dd>
    </div>
  );
}

export type TopupPurpose = "CHI_HO" | "HOAN";

/** Câu hướng dẫn theo mục đích nạp (SRS (4) FR-TOPUP-14): tiền chuyển đúng TK thì Kế toán mới ghi nhận đúng ngăn. */
const GUIDE: Record<TopupPurpose, string> = {
  CHI_HO: "Chuyển tiền nạp để chi hộ vào tài khoản dưới đây.",
  HOAN: "Chuyển tiền nạp để hoàn vào đúng tài khoản dưới đây, tương ứng nguồn tiền của giao dịch hoàn đã chọn.",
};

const HOAN_GROUP_GUIDE = "Chưa chọn giao dịch hoàn: chuyển tiền nạp để hoàn vào tài khoản theo nguồn thanh toán của đơn gốc.";

/** Nhóm tài khoản theo nguồn của đơn gốc (SRS (4) FR-TOPUP-14), dùng khi nạp để hoàn mà chưa chọn giao dịch hoàn. */
const SOURCE_GROUPS: { type: string; title: string }[] = [
  { type: "WALLET_ESCROW", title: "Đơn thanh toán bằng ví FlexPay" },
  { type: "COLLECTION_DISBURSEMENT", title: "Đơn thanh toán bằng nguồn khác" },
];

/**
 * Tài khoản bảo đảm để chuyển tiền nạp theo mục đích (`purpose`). Portal chỉ xem: nạp tiền không tự tạo ở đây, Kế toán ghi
 * nhận khi tiền về. Chưa cấu hình tài khoản đúng loại thì nói rõ "chưa cấu hình" thay vì để trống.
 */
export function ReceivingAccountCard({ accounts, purpose = "CHI_HO", groupBySource = false }: {
  accounts: ReceivingAccount[];
  purpose?: TopupPurpose;
  /** Nạp để hoàn chưa chọn giao dịch hoàn: chia tài khoản thành hai nhóm theo nguồn của đơn gốc. */
  groupBySource?: boolean;
}) {
  if (accounts.length === 0) {
    return (
      <Card padding="md" role="region" aria-labelledby="receiving-heading">
        <h2 id="receiving-heading" className="text-base font-semibold">Tài khoản nhận tiền nạp</h2>
        <p className="mt-2 text-sm text-muted-foreground">Chưa cấu hình tài khoản nhận tiền</p>
        <p className="mt-1 text-sm text-muted-foreground">Vui lòng liên hệ Flexpay để được cấp tài khoản nhận tiền nạp.</p>
      </Card>
    );
  }
  if (groupBySource) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{HOAN_GROUP_GUIDE}</p>
        {SOURCE_GROUPS.map((group) => {
          const inGroup = accounts.filter((account) => account.accountType === group.type);
          return (
            <section key={group.type} aria-labelledby={`source-${group.type}`} className="space-y-3">
              <h3 id={`source-${group.type}`} className="text-sm font-semibold">{group.title}</h3>
              {inGroup.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa cấu hình tài khoản nhận tiền cho nguồn này.</p>
              ) : (
                inGroup.map((account) => <AccountCard key={`${account.bankCode}-${account.accountNumber}`} account={account} />)
              )}
            </section>
          );
        })}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{GUIDE[purpose]}</p>
      {accounts.map((account) => (
        <AccountCard key={`${account.bankCode}-${account.accountNumber}`} account={account} />
      ))}
    </div>
  );
}

function AccountCard({ account }: { account: ReceivingAccount }) {
  return (
    <Card padding="md" role="region" aria-label={`Tài khoản nhận tiền ${account.bankName ?? account.bankCode}`}>
      <h2 className="mb-2 text-base font-semibold">{`Tài khoản nhận tiền nạp · ${account.bankName ?? account.bankCode}`}</h2>
      <dl>
        <Line label="Số tài khoản" value={account.accountNumber} copyLabel="số tài khoản" />
        <Line label="Chủ tài khoản" value={account.accountName} copyLabel="tên chủ tài khoản" />
        {account.subCode ? <Line label="Nội dung chuyển khoản" value={account.subCode} copyLabel="nội dung chuyển khoản" /> : null}
      </dl>
      {account.subCode ? (
        <p className="mt-2 text-xs text-muted-foreground">Ghi mã Sub-merchant vào nội dung chuyển khoản để Kế toán ghi nhận đúng Sub.</p>
      ) : null}
    </Card>
  );
}
