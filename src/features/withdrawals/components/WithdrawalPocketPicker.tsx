"use client";

import { Radio } from "@/components/ui/radio/Radio";
import { RadioGroup } from "@/components/ui/radio-group/RadioGroup";
import { formatAmount } from "@/lib/utils/helper";
import { POCKET_ORDER_LABELS, POCKET_SOURCE_LABELS } from "../constants/Withdrawal.constants";
import { withdrawalPocketSchema, type PocketWithdrawalView, type WithdrawalPocket } from "../schemas/withdrawal.schema";
import { pocketChoiceBlocker } from "../utils/withdrawal-limits";

type Props = {
  pockets: Partial<Record<WithdrawalPocket, PocketWithdrawalView>>;
  value: WithdrawalPocket | null;
  onChange: (pocket: WithdrawalPocket) => void;
};

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono tabular-nums">{formatAmount(value)}</span>
    </div>
  );
}

/**
 * Chọn nguồn tiền của lệnh rút (GĐ6): mỗi lệnh lấy tiền từ đúng một ngăn. Mỗi lựa chọn nói số rút được của ngăn; ngăn
 * không có gì để rút hoặc BE đang chặn thì khoá kèm câu của BE (không tự soạn lý do). Ngăn khác còn cho thấy tiền đang
 * giữ cho chi hộ, dư nợ Trả sau và số dư hiển thị (khả dụng trừ dư nợ, có thể âm).
 */
export function WithdrawalPocketPicker({ pockets, value, onChange }: Props) {
  return (
    <div role="group" aria-labelledby="withdrawal-pocket-label" className="space-y-2">
      <p id="withdrawal-pocket-label" className="text-sm font-medium">Nguồn tiền rút</p>
      <RadioGroup
        aria-labelledby="withdrawal-pocket-label"
        value={value ?? ""}
        onValueChange={(next) => {
          const parsed = withdrawalPocketSchema.safeParse(next);
          if (parsed.success) onChange(parsed.data);
        }}
      >
        {withdrawalPocketSchema.options.map((pocket) => {
          const view = pockets[pocket];
          if (!view) return null;
          const blocked = pocketChoiceBlocker(view);
          return (
            <Radio key={pocket} variant="card" showIndicator value={pocket} disabled={blocked !== null}>
              <div className="min-w-0 flex-1 space-y-1 text-left">
                <p className="font-semibold">{view.balanceLabel || POCKET_SOURCE_LABELS[pocket]}</p>
                <p className="text-sm text-muted-foreground">{view.orderLabel || POCKET_ORDER_LABELS[pocket]}</p>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>Rút được</span>
                  <span className="font-mono font-semibold tabular-nums">{formatAmount(view.withdrawableAmount)}</span>
                </div>
                {/* CC-02: tiền nạp / hoàn trả đã nằm trong số "Rút được" của ngăn khác; chỉ hiện khi có để không đọc nhầm là cộng thêm. */}
                {view.fundsAmount !== null && view.fundsAmount > 0 ? <Line label="Gồm tiền nạp và hoàn trả" value={view.fundsAmount} /> : null}
                {view.disbursementReserved !== null ? <Line label="Đang giữ cho chi hộ" value={view.disbursementReserved} /> : null}
                {view.overdraft !== null ? <Line label="Dư nợ Trả sau" value={view.overdraft} /> : null}
                {view.displayBalance !== null ? <Line label="Số dư hiển thị" value={view.displayBalance} /> : null}
                {blocked ? <p className="pt-1 text-sm text-warning">{blocked}</p> : null}
              </div>
            </Radio>
          );
        })}
      </RadioGroup>
    </div>
  );
}
