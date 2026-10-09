"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { QRCode } from "@/components/ui/qrcode/QRCode";
import type { Order } from "../types/types";
import { formatCountdown } from "../utils/order-mapper";

type Props = { order: Order; qrValue: string; now: Date };

/** A live QR with its remaining time. An expired QR is never drawn, so nobody scans a dead code. */
export function OrderQrPanel({ order, qrValue, now }: Props) {
  const [copied, setCopied] = useState(false);
  const countdown = order.status === "ACTIVE" ? formatCountdown(order.expiredAt, now) : null;

  const copy = () => {
    navigator.clipboard.writeText(qrValue).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border border-border bg-white p-3.5">
        <QRCode value={qrValue} size="lg" level="M" renderer="svg" title={`Mã QR đơn ${order.orderCode}`} />
      </div>
      {countdown ? (
        <p className="text-sm text-muted-foreground">
          Mã QR còn hiệu lực <span className="font-mono font-semibold tabular-nums text-foreground">{countdown}</span>
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        onClick={copy}
      >
        {copied ? "Đã sao chép" : "Sao chép nội dung QR"}
      </Button>
    </div>
  );
}
