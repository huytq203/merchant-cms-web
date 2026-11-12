import { Check } from "lucide-react";
import type { CustomerDisplay, CustomerDisplayStatus } from "../schemas";
import { formatPaidTime, formatVnd, paymentSourceLabel } from "../utils/display-format";
import styles from "./customer-display.module.css";

type Props = { display: CustomerDisplay; payment: CustomerDisplayStatus | null; now: Date };

/** "Thanh toán thành công" cho khách: số tiền, nguồn tiền, mã đơn và thời gian. Vai trò status để trình đọc màn hình đọc ngay. */
export function DisplayPaidPanel({ display, payment, now }: Props) {
  const amount = payment?.paidAmount ?? display.payableAmount ?? display.amount;
  // QR tĩnh: mã đơn của lần trả vừa rồi đi kèm trạng thái PAID; mã SQ… của quầy không phải mã đơn.
  const orderCode = payment?.orderCode ?? (display.kind === "ORDER" ? display.displayCode : null);
  return (
    <div className={styles.ok} role="status">
      <span className={styles.tick} aria-hidden="true">
        <Check size={48} strokeWidth={3} />
      </span>
      <p className={styles.okTitle}>Thanh toán thành công</p>
      <p className={styles.meta}>Cảm ơn quý khách</p>
      <dl className={styles.rows}>
        {amount != null ? (
          <div className={styles.row}>
            <dt>Số tiền</dt>
            <dd><b>{formatVnd(amount)}đ</b></dd>
          </div>
        ) : null}
        <div className={styles.row}>
          <dt>Nguồn tiền</dt>
          <dd><b>{paymentSourceLabel(payment?.paymentMethod)}</b></dd>
        </div>
        {orderCode ? (
          <div className={styles.row}>
            <dt>Mã đơn</dt>
            <dd><b>{orderCode}</b></dd>
          </div>
        ) : null}
        <div className={styles.row}>
          <dt>Thời gian</dt>
          <dd><b>{formatPaidTime(payment?.paidAt, now)}</b></dd>
        </div>
      </dl>
    </div>
  );
}
