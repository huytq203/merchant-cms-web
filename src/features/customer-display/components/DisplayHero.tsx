import Image from "next/image";
import { DISPLAY_LOGOS, type FlexiePose } from "../constants/flexie";
import styles from "./customer-display.module.css";

type Props = { pose: FlexiePose; overline: string; showSteps: boolean };

/** Cột quảng bá ví FlexPay: logo, câu chào của Flexie, linh vật trên quầng sáng lime, ba bước trả và lời mời tải app. */
export function DisplayHero({ pose, overline, showSteps }: Props) {
  return (
    <section className={styles.hero} aria-label="Thanh toán bằng ví FlexPay">
      <div className={styles.rings} aria-hidden="true" />
      <Image className={styles.logo} src={DISPLAY_LOGOS.onDark} alt="FlexPay" priority />
      <p className={styles.over}>{overline}</p>
      <p className={styles.say}>{pose.say}</p>
      <p className={styles.sub}>{pose.sub}</p>
      <div className={styles.stage}>
        {/* key theo ảnh để hiệu ứng "nhảy lên" chạy lại mỗi lần đổi Flexie. */}
        <Image key={pose.image.src} className={styles.mascot} src={pose.image} alt="Linh vật Flexie" priority />
      </div>
      {showSteps ? (
        <ol className={styles.steps}>
          <li className={styles.step}><b>BƯỚC 1</b>Mở app FlexPay</li>
          <li className={styles.step}><b>BƯỚC 2</b>Chọn Quét QR</li>
          <li className={styles.step}><b>BƯỚC 3</b>Nhập OTP là xong</li>
        </ol>
      ) : null}
      <div className={styles.download}>
        <span>Chưa có ví? Tải FlexPay trên App Store và Google Play</span>
        <span className={styles.cta}>Tải app</span>
      </div>
    </section>
  );
}
