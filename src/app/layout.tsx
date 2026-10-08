import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { publicEnv } from "@/lib/env/public";
import { siteConfig } from "@/config/site";
import "@/styles/index.css";
import { Toaster } from '@/components/ui/toast/Toaster';

// Be Vietnam Pro là phông duy nhất của ứng dụng (hỗ trợ đầy đủ dấu tiếng Việt).
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: publicEnv.NEXT_PUBLIC_APP_NAME,
    template: `%s · ${publicEnv.NEXT_PUBLIC_APP_NAME}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1413" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={beVietnamPro.variable}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <AppProviders>{children}</AppProviders>
        <Toaster position="top-center" expand={true} richColors />
      </body>
    </html>
  );
}
