"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { isPushConfigured, registerPush } from "../register-push";

type Status = "hidden" | "ready" | "blocked" | "error";

/** Đọc trạng thái trình duyệt; chỉ chạy ở client sau khi mount để không lệch hydration. */
function initialStatus(): Status {
  if (!isPushConfigured() || typeof Notification === "undefined") return "hidden";
  if (Notification.permission === "granted") return "hidden"; // đã bật: PushSync tự làm mới token
  return Notification.permission === "denied" ? "blocked" : "ready";
}

const subscribeNothing = () => () => {};

/**
 * Nút "Bật thông báo trên trình duyệt" đặt trong hộp thư. Hộp thoại xin quyền chỉ hiện sau khi user bấm;
 * thiếu cấu hình Firebase hoặc trình duyệt không hỗ trợ thì không hiện gì.
 */
export function PushOptIn() {
  // Server render và lần render hydrate đầu luôn là "hidden"; sau đó mới đọc trạng thái thật của trình duyệt.
  const detected = useSyncExternalStore(subscribeNothing, initialStatus, () => "hidden" as Status);
  const [override, setStatus] = useState<Status | null>(null);
  const status = override ?? detected;
  const [isPending, setIsPending] = useState(false);

  async function enable() {
    setIsPending(true);
    try {
      const result = await registerPush();
      setStatus(result === "granted" ? "hidden" : result === "denied" ? "blocked" : "hidden");
    } catch {
      setStatus("error");
    } finally {
      setIsPending(false);
    }
  }

  if (status === "hidden") return null;
  if (status === "blocked") {
    return (
      <p className="text-xs text-muted-foreground">
        Trình duyệt đang chặn thông báo. Hãy cho phép thông báo cho trang này trong phần cài đặt của trình duyệt rồi thử lại.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" size="sm" isLoading={isPending} onClick={() => void enable()}>
        <BellRing className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Bật thông báo trên trình duyệt
      </Button>
      {status === "error" ? (
        <p role="alert" className="text-xs text-danger">Không bật được thông báo, vui lòng thử lại sau.</p>
      ) : null}
    </div>
  );
}
