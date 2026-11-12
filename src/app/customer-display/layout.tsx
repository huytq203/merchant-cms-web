import type { Metadata } from "next";
import localFont from "next/font/local";

// Lexend lấy từ app mobile (hệ thiết kế v2): màn khách nhìn thấy phải cùng chữ với app FlexPay trên điện thoại khách.
const lexend = localFont({
  src: "./Lexend-Variable.ttf",
  weight: "100 900",
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hiển thị cho khách",
  robots: { index: false, follow: false },
};

/** Màn chiếu cho khách: không menu, không khung CMS; chỉ nạp phông Lexend cho riêng nhánh route này. */
export default function CustomerDisplayLayout({ children }: { children: React.ReactNode }) {
  return <div className={lexend.variable}>{children}</div>;
}
