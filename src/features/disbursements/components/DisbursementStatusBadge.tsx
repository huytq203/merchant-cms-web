import { StatusBadge } from "@/components/page/StatusBadge";
import { DISBURSEMENT_STATUSES, statusLabel, statusTone } from "../utils/disbursement-status";

type Props = {
  status: string;
  /** Nhãn BE gửi kèm; chỉ dùng cho mã trạng thái mà FE chưa biết. */
  fallbackLabel?: string | null;
};

/** Một trong 7 trạng thái hiển thị; mã lạ (BE thêm sau) dùng nhãn BE gửi, rồi tới chính mã. */
export function DisbursementStatusBadge({ status, fallbackLabel }: Props) {
  const known = (DISBURSEMENT_STATUSES as readonly string[]).includes(status);
  return <StatusBadge label={known ? statusLabel(status) : (fallbackLabel ?? status)} tone={statusTone(status)} />;
}
