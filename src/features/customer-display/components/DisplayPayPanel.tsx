import Image from "next/image";
import { QRCode } from "@/components/ui/qrcode/QRCode";
import { DISPLAY_LOGOS } from "../constants/flexie";
import type { CustomerDisplay } from "../schemas";
import { formatVnd } from "../utils/display-format";
import { formatRemaining, hasCustomerFee } from "../utils/display-state";
import styles from "./customer-display.module.css";

type Props = { display: CustomerDisplay; now: Date; offline: boolean };

function Money({ value }: { value: number }) {
  return (
    <>
      {formatVnd(value)}
      <sup>đ</sup>
    </>
  );
}

/** Số tiền: đơn thường hiện một số; đơn khách chịu phí hiện tổng và dòng "Đơn hàng + Phí"; QR tĩnh mời khách nhập tiền. */
function AmountBlock({ display }: { display: CustomerDisplay }) {
  if (display.kind === "STATIC_QR") {
    return (
      <>
        <p className={styles.amountLabel}>Quét mã để thanh toán</p>
        <p className={styles.amountHint}>Nhập số tiền trên app</p>
      </>
    );
  }
  const withFee = hasCustomerFee(display);
  // Số khách phải trả luôn là `payableAmount` của BE (đã cộng phí nếu khách chịu).
  const payable = display.payableAmount ?? display.amount ?? 0;
  return (
    <>
      <p className={styles.amountLabel}>{withFee ? "Tổng thanh toán" : "Số tiền thanh toán"}</p>
      <p className={styles.amount}>
        <Money value={payable} />
      </p>
      {withFee ? (
        <p className={styles.meta}>
          Đơn hàng <b>{formatVnd(display.amount ?? 0)}đ</b> + Phí thanh toán <b>{formatVnd(display.fee ?? 0)}đ</b>
        </p>
      ) : null}
    </>
  );
}

/** Mã QR dựng từ `qrPayload`, mức sửa lỗi H để logo FlexPay đặt giữa mà vẫn quét được. */
export function DisplayQr({ payload, label }: { payload: string; label: string }) {
  return (
    <div className={styles.card}>
      <div className={styles.qr}>
        <QRCode value={payload} level="H" marginSize={0} pixelSize={420} renderer="svg" title={label} />
      </div>
      <span className={styles.qrLogo} aria-hidden="true">
        <Image src={DISPLAY_LOGOS.mini} alt="" width={30} height={30} />
      </span>
    </div>
  );
}

export function DisplayPayPanel({ display, now, offline }: Props) {
  const isStatic = display.kind === "STATIC_QR";
  const remaining = isStatic ? null : formatRemaining(display.expiresAt, now);
  return (
    <>
      <AmountBlock display={display} />
      {display.qrPayload ? (
        <DisplayQr payload={display.qrPayload} label={isStatic ? "Mã QR thanh toán của quầy" : `Mã QR thanh toán đơn ${display.displayCode ?? ""}`} />
      ) : (
        // BE trả `qrPayload = null` khi đơn chưa có QR: không vẽ mã rỗng, mời khách chờ thu ngân.
        <p className={styles.meta} role="status">Đơn hàng chưa có mã QR, vui lòng chờ thu ngân.</p>
      )}
      {isStatic ? (
        <p className={styles.meta}>Mã cố định của quầy, dùng được nhiều lần</p>
      ) : (
        <p className={styles.meta}>
          {display.displayCode ? <>Mã đơn <b>{display.displayCode}</b></> : null}
          {display.displayCode && remaining ? " · " : null}
          {remaining ? <>Hết hạn sau <b role="timer">{remaining}</b></> : null}
        </p>
      )}
      {/* QR tĩnh dùng template riêng của FlexPay, app ngân hàng chưa đọc được (đợt 2 mới thêm VA) nên chỉ mời ví FlexPay. */}
      <div className={styles.chips}>
        <span className={`${styles.chip} ${styles.chipMain}`}>Ví FlexPay</span>
        {isStatic ? null : (
          <>
            <span className={styles.chip}>App ngân hàng</span>
            <span className={styles.chip}>VietQR · Napas 247</span>
          </>
        )}
      </div>
      {offline ? <p className={styles.offline} role="status">Mất kết nối, đang thử lại…</p> : null}
    </>
  );
}
