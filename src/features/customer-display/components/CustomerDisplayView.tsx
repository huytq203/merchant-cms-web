"use client";

import { FLEXIE_POSES, FLEXIE_THANKS } from "../constants/flexie";
import type { CustomerDisplayState } from "../hooks/use-customer-display";
import { flexieIndex } from "../utils/display-state";
import styles from "./customer-display.module.css";
import { DisplayHero } from "./DisplayHero";
import { DisplayPaidPanel } from "./DisplayPaidPanel";
import { DisplayPayPanel } from "./DisplayPayPanel";
import { FullscreenButton } from "./FullscreenButton";

export type CustomerDisplayViewProps = Omit<CustomerDisplayState, "retry"> & {
  now: Date;
  onRetry: () => void;
  /** Hạt giống chọn Flexie khi chưa có mã đơn (đang tải/lỗi): id đơn hoặc id mã tĩnh trên URL. */
  seed: string;
};

function Notice({ title, text, onRetry }: { title: string; text: string; onRetry?: () => void }) {
  return (
    <div className={styles.notice} role="alert">
      <p className={styles.noticeTitle}>{title}</p>
      <p className={styles.noticeText}>{text}</p>
      {onRetry ? <button type="button" className={styles.retry} onClick={onRetry}>Thử lại</button> : null}
    </div>
  );
}

function PayColumn(props: CustomerDisplayViewProps) {
  const { status, display, phase, payment, offline, error, now, onRetry } = props;
  if (status === "loading") {
    return <div className={styles.skeleton} role="status" aria-label="Đang tải mã thanh toán" />;
  }
  if (status === "error" || !display) {
    return <Notice title="Chưa hiển thị được mã" text={error ?? "Không tải được màn hiển thị"} onRetry={onRetry} />;
  }
  if (phase === "paid") return <DisplayPaidPanel display={display} payment={payment} now={now} />;
  if (phase === "closed") {
    // Đơn hết hạn/hủy hoặc token hết hạn; QR tĩnh bị tắt/xoay hoặc hết ca 12 giờ: thu ngân phải mở lại màn.
    return display.kind === "STATIC_QR" ? (
      <Notice title="Mã QR đã ngừng hiển thị" text="Mã đã được đổi, bị tắt hoặc hết hạn. Vui lòng mở lại màn hiển thị." />
    ) : (
      <Notice title="Mã thanh toán đã hết hạn" text="Quý khách vui lòng liên hệ thu ngân để nhận mã mới." />
    );
  }
  return <DisplayPayPanel display={display} now={now} offline={offline} />;
}

/**
 * Màn "Hiển thị cho khách" toàn màn hình theo mock up đã duyệt 12/11/2026: cột thanh toán (tên quầy, số tiền, mã QR)
 * và cột quảng bá ví FlexPay với Flexie. Chỉ trình bày; điều phối nằm ở `useCustomerDisplay`.
 */
export function CustomerDisplayView(props: CustomerDisplayViewProps) {
  const { display, phase, seed } = props;
  const paid = phase === "paid" && props.status === "ready";
  // Flexie cố định theo mã đơn (QR tĩnh: theo mã SQ) để tải lại vẫn cùng linh vật; thanh toán xong đổi sang Flexie cảm ơn.
  const pose = paid ? FLEXIE_THANKS : (FLEXIE_POSES[flexieIndex(display?.displayCode ?? seed, FLEXIE_POSES.length)] ?? FLEXIE_THANKS);
  const shop = display ? [display.shop.name, display.shop.terminalName].filter(Boolean).join(" · ") : null;

  return (
    <main className={styles.screen}>
      <FullscreenButton />
      <section className={styles.pay} aria-label="Thông tin thanh toán" aria-live="polite">
        {shop ? (
          <p className={styles.shop}>
            <span className={styles.shopName}>{shop}</span>
          </p>
        ) : null}
        <PayColumn {...props} />
      </section>
      <DisplayHero pose={pose} overline={paid ? "Giao dịch hoàn tất" : "Thanh toán bằng ví FlexPay"} showSteps={!paid} />
    </main>
  );
}
