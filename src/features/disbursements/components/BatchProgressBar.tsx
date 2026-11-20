import type { BatchProgress } from "../utils/disbursement-status";

type Props = { progress: BatchProgress; label?: string };

/** Thanh tiến độ: phần trăm lệnh đã có kết cục (Thành công / Thất bại / Đã hủy) trên tổng số lệnh của lô. */
export function BatchProgressBar({ progress, label = "Tiến độ chi của lô" }: Props) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress.percent}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress.percent}%` }} />
    </div>
  );
}
