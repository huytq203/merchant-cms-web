"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseExpiredAt } from "@/features/orders/utils/order-mapper";
import { ApiError } from "@/lib/http/api-client";
import { STATIC_PAID_FLASH_MS, STATUS_POLL_MS } from "../constants/flexie";
import { fetchDisplayStatus, openDisplay, type DisplaySource } from "../customer-display-api";
import type { CustomerDisplay, CustomerDisplayStatus } from "../schemas";
import { classifyStatus, isNewStaticPayment, type DisplayPhase } from "../utils/display-state";

/** Sau ba lượt hỏi lỗi liên tiếp (~9 giây) mới báo mất kết nối, để một lần chập chờn không làm khách lo. */
const OFFLINE_AFTER_FAILURES = 3;

/**
 * Token sai hoặc hết hạn: BE trả 401 (mã 6311), BFF đổi thành 403; 404 khi không còn màn. Cả ba nghĩa là
 * hỏi tiếp cũng vô ích, nên đóng màn và chờ thu ngân mở lại. Lỗi khác (mạng, 429, 5xx) thì hỏi tiếp.
 */
const TOKEN_GONE_STATUSES = new Set([401, 403, 404]);

export type CustomerDisplayState = {
  status: "loading" | "error" | "ready";
  display: CustomerDisplay | null;
  phase: DisplayPhase;
  /** Lần trả vừa báo thành công (đơn: lần trả của đơn; QR tĩnh: lần trả gần nhất). */
  payment: CustomerDisplayStatus | null;
  offline: boolean;
  error: string | null;
  retry: () => void;
};

/**
 * Điều phối màn "Hiển thị cho khách": mở màn (lấy mã + token), rồi hỏi trạng thái mỗi 3 giây bằng `displayToken`.
 * - Đơn: thấy đã trả thì chuyển "Thanh toán thành công" và thôi hỏi; hết hạn/hủy thì thôi hiện mã.
 * - QR tĩnh: mỗi lần trả mới hiện thành công 5 giây rồi quay lại mã, vẫn hỏi tiếp cho khách sau; mã bị tắt/xoay
 *   (CANCELLED) thì đóng màn.
 * - Token hết hạn hoặc sai (401/403/404): đóng màn, thôi hỏi.
 */
export function useCustomerDisplay(source: DisplaySource): CustomerDisplayState {
  // Kết quả mở màn gắn với khóa yêu cầu (đơn/mã + lần thử): khóa đổi thì tự coi là đang tải, không cần reset trong effect.
  const [opened, setOpened] = useState<{ key: string; display: CustomerDisplay | null; error: string | null } | null>(null);
  const [phase, setPhase] = useState<DisplayPhase>("waiting");
  const [payment, setPayment] = useState<CustomerDisplayStatus | null>(null);
  const [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lastSeenPaidAt = useRef<string | null>(null);

  // Mở màn: mỗi lần mở BE cấp token mới, nên chỉ chạy lại khi đổi đơn/mã hoặc người dùng bấm thử lại.
  const requestKey = `${source.kind}:${source.id}:${attempt}`;
  const current = opened?.key === requestKey ? opened : null;
  const display = current?.display ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    let cancelled = false;
    openDisplay({ kind: source.kind, id: source.id }).then(
      (next) => {
        if (cancelled) return;
        lastSeenPaidAt.current = null;
        setPayment(null);
        setPhase("waiting");
        setOpened({ key: requestKey, display: next, error: null });
      },
      (reason: unknown) => {
        if (cancelled) return;
        setOpened({ key: requestKey, display: null, error: reason instanceof ApiError ? reason.message : "Không tải được màn hiển thị" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey, source.kind, source.id]);

  const isStatic = display?.kind === "STATIC_QR";
  // Đơn thôi hỏi khi đã có kết quả; QR tĩnh hỏi mãi vì quầy còn khách sau, tới khi màn đóng.
  const polling = Boolean(display) && phase !== "closed" && (isStatic || phase === "waiting");

  useEffect(() => {
    if (!polling || !display) return;
    let cancelled = false;
    let timer: number | undefined;
    let failures = 0;

    const tick = async () => {
      try {
        const next = await fetchDisplayStatus(display.displayToken);
        if (cancelled) return;
        failures = 0;
        setOffline(false);
        if (display.kind === "STATIC_QR") {
          if (classifyStatus(next.status) === "closed") {
            setPhase("closed");
            return;
          }
          if (isNewStaticPayment(next, lastSeenPaidAt.current)) {
            lastSeenPaidAt.current = next.paidAt ?? null;
            setPayment(next);
            setPhase("paid");
          }
        } else if (classifyStatus(next.status) !== "waiting") {
          setPayment(next);
          setPhase(classifyStatus(next.status));
          return;
        }
      } catch (reason) {
        if (cancelled) return;
        if (reason instanceof ApiError && TOKEN_GONE_STATUSES.has(reason.status)) {
          setPhase("closed");
          return;
        }
        failures += 1;
        if (failures >= OFFLINE_AFTER_FAILURES) setOffline(true);
      }
      if (!cancelled) timer = window.setTimeout(() => void tick(), STATUS_POLL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [polling, display]);

  // QR tĩnh: báo thành công 5 giây rồi quay lại mã cho khách tiếp theo.
  useEffect(() => {
    if (!isStatic || phase !== "paid") return;
    const timer = window.setTimeout(() => setPhase("waiting"), STATIC_PAID_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [isStatic, phase, payment]);

  // Đơn: tới giờ hết hạn thì thôi hiện mã ngay, không chờ job hết hạn của BE.
  useEffect(() => {
    if (!display || isStatic || phase !== "waiting") return;
    const end = parseExpiredAt(display.expiresAt);
    if (!end) return;
    const timer = window.setTimeout(() => setPhase("closed"), Math.max(0, end.getTime() - Date.now()));
    return () => window.clearTimeout(timer);
  }, [display, isStatic, phase]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    status: error ? "error" : display ? "ready" : "loading",
    display,
    phase,
    payment,
    offline,
    error,
    retry,
  };
}
