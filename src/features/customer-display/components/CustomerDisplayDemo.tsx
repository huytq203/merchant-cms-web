"use client";

import Link from "next/link";
import { DEMO_STATES, type DemoState } from "../constants/demo-states";
import type { CustomerDisplay, CustomerDisplayStatus } from "../schemas";
import type { DisplayPhase } from "../utils/display-state";
import { CustomerDisplayView } from "./CustomerDisplayView";

/**
 * Xem nhanh mọi trạng thái của màn (chỉ dev, khi bật fixture) để duyệt giao diện mà không cần đơn thật.
 * Dữ liệu là mẫu; mã QR không thanh toán được.
 */

const LABELS: Record<DemoState, string> = {
  dynamic: "QR động",
  fee: "Khách chịu phí",
  static: "QR tĩnh",
  paid: "Đã thanh toán",
  expired: "Hết hạn",
  error: "Lỗi tải",
};

const base: CustomerDisplay = {
  kind: "ORDER",
  displayToken: "demo",
  tokenExpiresAt: null,
  qrPayload: "00020101021238570010A000000727012700069704360113MOCKFLEXPAY0208QRPUSH53037045406150000" + "5802VN62150111DH-2405186304ABCD",
  shop: { name: "Halo tech", terminalName: "Quầy 01" },
  orderId: null,
  orderCode: "DH-240518",
  displayCode: "DH-240518",
  amount: 150_000,
  fee: 1_500,
  feeBearer: "MERCHANT",
  payableAmount: 150_000,
  expiresAt: null,
  staticQrId: null,
  code: null,
};

function demoData(state: DemoState, now: Date): { display: CustomerDisplay; phase: DisplayPhase; payment: CustomerDisplayStatus | null } {
  const expiresAt = new Date(now.getTime() + 14 * 60_000 + 7 * 3_600_000).toISOString().slice(0, 19);
  const order = { ...base, expiresAt };
  switch (state) {
    case "fee":
      return { display: { ...order, fee: 2_200, feeBearer: "SENDER", payableAmount: 152_200 }, phase: "waiting", payment: null };
    case "static":
      return {
        display: { ...base, kind: "STATIC_QR", orderCode: null, code: "SQK7M2Q9XA4B", displayCode: "SQK7M2Q9XA4B", amount: null, fee: null, feeBearer: null, payableAmount: null, qrPayload: "00020101021126300010VN.FLEXPAY0112SQK7M2Q9XA4B5303704" + "5802VN5909HALO TECH6006HA NOI6304ABCD" },
        phase: "waiting",
        payment: null,
      };
    case "paid":
      return { display: order, phase: "paid", payment: { status: "PAID", orderStatus: "SUCCESS", paidAt: null, paidAmount: 150_000, paymentMethod: "FLEXPAY_WALLET", orderCode: "DH-240518" } };
    case "expired":
      return { display: order, phase: "closed", payment: null };
    default:
      return { display: order, phase: "waiting", payment: null };
  }
}

export function CustomerDisplayDemo({ state, now }: { state: DemoState; now: Date }) {
  const data = demoData(state, now);
  return (
    <>
      <CustomerDisplayView
        status={state === "error" ? "error" : "ready"}
        error={state === "error" ? "Đơn hàng không còn chờ thanh toán" : null}
        offline={false}
        now={now}
        seed="demo"
        onRetry={() => undefined}
        {...data}
      />
      <nav aria-label="Trạng thái mẫu" className="fixed top-3 left-1/2 flex -translate-x-1/2 flex-wrap gap-1 rounded-xl bg-background/90 p-1.5 text-xs shadow-subtle">
        {DEMO_STATES.map((item) => (
          <Link key={item} href={`?state=${item}`} aria-current={item === state ? "page" : undefined} className="rounded-lg px-2 py-1 aria-[current=page]:bg-secondary">
            {LABELS[item]}
          </Link>
        ))}
      </nav>
    </>
  );
}
