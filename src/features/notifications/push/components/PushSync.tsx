"use client";

import { useEffect } from "react";
import { registerPush } from "../register-push";

/**
 * Chạy một lần khi vào CMS sau đăng nhập: nếu trình duyệt đã được cấp quyền từ trước thì gắn lại token cho user vừa đăng nhập.
 * Chế độ `silent` không bao giờ hiện hộp thoại xin quyền.
 */
export function PushSync() {
  useEffect(() => {
    registerPush({ silent: true }).catch(() => {
      // Push là tính năng phụ; lỗi mạng hay cấu hình không được làm hỏng trang.
    });
  }, []);
  return null;
}
