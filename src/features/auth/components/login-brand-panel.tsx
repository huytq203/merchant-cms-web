import Image from "next/image";

import AppImage from "../../../../public/images/image.webp";
import EarthImage from "../../../../public/images/earth.png";
import WhiteLogo from "../../../../public/brand/logo-white-yellow.webp";

export function LoginBrandPanel() {
  return (
    <>
      {/* Left: Color panel */}
      <div className="hidden md:flex w-[70%] flex-col justify-between p-12 bg-linear-to-br bg-primary/85 relative overflow-hidden">
        {/* 3 decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 -right-32 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 left-1/4 w-56 h-56 bg-white/5 rounded-full" />

        {/* Earth overlay */}
        <div className="absolute -bottom-16 -right-20 w-[75%] aspect-square pointer-events-none select-none">
          <Image
            src={EarthImage}
            alt=""
            fill
            sizes="50vw"
            className="object-contain mix-blend-screen "
            aria-hidden
          />
        </div>

        {/* Logo Section */}
        <div className="relative flex items-center gap-5">
          <Image
            src={WhiteLogo}
            width={720}
            height={212}
            alt="Flexpay Logo"
            className="h-10 w-auto"
          />
          <div className="h-6 w-px bg-white/20" aria-hidden="true" />
          <span className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
            Giải pháp thanh toán
          </span>
        </div>

        {/* App showcase */}
        <div className="relative flex flex-col items-center gap-6">
          {/* Ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* Mockup image */}
          <div className="relative w-full max-w-[320px] lg:max-w-[420px] xl:max-w-[420px] 2xl:max-w-[600px] aspect-500/380 drop-shadow-[0_32px_48px_rgba(0,0,0,0.35)]">
            <Image
              src={AppImage}
              alt="Flexpay bảo vệ bạn"
              priority
              fill
              sizes="(max-width: 1023px) 320px, (max-width: 1279px) 420px, (max-width: 1535px) 420px, 600px"
              className="object-contain rounded-2xl"
            />
          </div>

          {/* Caption */}
          <div className="relative text-center space-y-2 max-w-[280px]">
            <p className="text-white text-lg font-semibold tracking-tight">
              Flexpay bảo vệ bạn
            </p>
            <p className="text-white/55 text-sm leading-relaxed">
              Bảo mật thông tin khách hàng luôn được đặt lên hàng đầu tại
              Flexpay.
            </p>
          </div>
        </div>

        <p className="relative text-white/30 text-xs">
          © 2026 Flexpay. All rights reserved.
        </p>
      </div>
    </>
  );
}
