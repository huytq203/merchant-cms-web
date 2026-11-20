"use client";

import { useState } from "react";
import { Notice } from "@/components/page/Notice";

type Props = {
  onLookup: () => void;
  isLookingUp: boolean;
  /** Chỉ true sau khi người dùng đã thử tra lại ít nhất một lần. */
  canAbandon: boolean;
  onAbandon: () => void;
};

/**
 * Cảnh báo bền khi chưa biết lệnh đã được tạo hay chưa (503/timeout lúc gửi). Mã yêu cầu và nội dung lệnh đang bị khoá
 * để lần gửi lại là đúng lệnh đó. Lối thoát: tra lại theo mã, hoặc (sau khi đã tra) chủ động bỏ lệnh để tạo lệnh khác
 * kèm cảnh báo có thể chi hai lần.
 */
export function UnconfirmedOrderNotice({ onLookup, isLookingUp, canAbandon, onAbandon }: Props) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="w-full space-y-2 text-left">
      <Notice tone="warning">
        Lệnh có thể đã được tạo. Mã yêu cầu và nội dung lệnh đang được khóa: hãy xin mã OTP mới rồi gửi lại với cùng mã yêu cầu, hoặc tra lại lệnh theo mã.
      </Notice>
      <button
        type="button"
        onClick={onLookup}
        disabled={isLookingUp}
        className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
      >
        {isLookingUp ? "Đang tra lệnh..." : "Tra lại lệnh theo mã yêu cầu"}
      </button>
      {canAbandon ? (
        confirming ? (
          <div className="space-y-2">
            <Notice tone="danger">
              Lệnh trước vẫn chưa được xác nhận và có thể đã được chi. Tạo lệnh khác có thể khiến bạn chi hai lần.
            </Notice>
            <button type="button" onClick={onAbandon} className="text-sm font-semibold text-danger hover:underline">
              Vẫn tạo lệnh khác
            </button>
          </div>
        ) : (
          <div>
            <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-muted-foreground hover:underline">
              Tạo lệnh khác
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}
