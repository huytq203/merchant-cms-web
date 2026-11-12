"use client";

import { useState } from "react";
import { MonitorSmartphone, Plus, RefreshCw, Power } from "lucide-react";
import { ConfirmModal } from "@/components/modal";
import { ReasonConfirmModal } from "@/components/modal/ReasonConfirmModal";
import { Notice } from "@/components/page/Notice";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { QRCode } from "@/components/ui/qrcode/QRCode";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { customerDisplayHref, openCustomerDisplay } from "@/features/customer-display/utils/open-display";
import type { StaticQr, StaticQrScope } from "../schemas";
import { useStaticQr } from "../hooks/use-static-qr";

type Props = {
  /** Phạm vi của mã: cả Sub (terminalId trống) hoặc một Terminal; `name` để nêu rõ đối tượng trong dialog. */
  scope: (StaticQrScope & { name: string }) | null;
  /** MANAGE_TERMINAL: tạo, đổi, tắt mã. Người chỉ có quyền xem vẫn mở được màn hiển thị. */
  canManage: boolean;
  onClose: () => void;
};

function ActiveCode({ qr }: { qr: StaticQr }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <QRCode value={qr.qrPayload} size="lg" level="H" renderer="svg" title={`Mã QR tĩnh ${qr.code}`} />
      <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Mã</dt>
        <dd className="text-right font-mono font-semibold">{qr.code}</dd>
        <dt className="text-muted-foreground">Phiên bản</dt>
        <dd className="text-right tabular-nums">{qr.version ?? 1}</dd>
        <dt className="text-muted-foreground">Hiệu lực từ</dt>
        <dd className="text-right tabular-nums">{formatVnDateTime(qr.effectiveFrom)}</dd>
      </dl>
    </div>
  );
}

/**
 * Quản lý mã QR tĩnh FlexPay của một Sub hoặc Terminal (QR ví FlexPay đợt 1): xem mã đang dùng, mở màn
 * "Hiển thị QR tĩnh" cho khách, tạo mã, đổi mã (mã cũ in ra giấy thôi dùng được) và tắt mã kèm lý do.
 */
export function StaticQrDialog({ scope, canManage, onClose }: Props) {
  const open = scope !== null;
  const { query, active, create, rotate, disable } = useStaticQr(scope ?? { subMerchantId: "" }, open);
  const [confirm, setConfirm] = useState<"rotate" | "disable" | null>(null);
  const actionError = (create.error ?? rotate.error)?.message;

  return (
    <>
      <Dialog open={open && confirm === null} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mã QR tĩnh</DialogTitle>
            <DialogDescription>
              {scope?.name}. Mã cố định của quầy, khách quét bằng app FlexPay rồi tự nhập số tiền.
            </DialogDescription>
          </DialogHeader>
          {query.isPending ? <ResultState state="loading" /> : null}
          {query.isError ? <ResultState state="error" errorMessage={query.error.message} onRetry={() => void query.refetch()} /> : null}
          {query.isSuccess && !active ? (
            <ResultState state="empty" emptyMessage={canManage ? "Chưa có mã QR tĩnh. Tạo mã để in đặt tại quầy." : "Chưa có mã QR tĩnh. Liên hệ người quản lý Terminal để tạo mã."} />
          ) : null}
          {active ? <ActiveCode qr={active} /> : null}
          {actionError ? <Notice tone="danger">{actionError}</Notice> : null}
          <div className="flex flex-wrap justify-end gap-2">
            {active && canManage ? (
              <>
                <Button type="button" variant="outline" onClick={() => setConfirm("disable")}>
                  <Power size={16} aria-hidden="true" /> Tắt mã
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirm("rotate")}>
                  <RefreshCw size={16} aria-hidden="true" /> Đổi mã
                </Button>
              </>
            ) : null}
            {active ? (
              <Button type="button" variant="solid" onClick={() => openCustomerDisplay(customerDisplayHref.staticQr(active.id))}>
                <MonitorSmartphone size={16} aria-hidden="true" /> Hiển thị QR tĩnh
              </Button>
            ) : null}
            {query.isSuccess && !active && canManage ? (
              <Button type="button" variant="solid" isLoading={create.isPending} onClick={() => create.mutate()}>
                <Plus size={16} aria-hidden="true" /> Tạo mã QR tĩnh
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmModal
        open={confirm === "rotate"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title="Đổi mã QR tĩnh"
        description={`Đổi mã ${active?.code ?? ""} của ${scope?.name ?? ""}? Mã cũ đã in sẽ không thanh toán được nữa, cần in lại mã mới.`}
        confirmLabel="Đổi mã"
        cancelLabel="Giữ mã cũ"
        isLoading={rotate.isPending}
        onConfirm={() => {
          if (active) rotate.mutate(active.id, { onSettled: () => setConfirm(null) });
        }}
      />
      <ReasonConfirmModal
        open={confirm === "disable"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title="Tắt mã QR tĩnh"
        description="Khách quét mã đã tắt sẽ bị từ chối. Có thể tạo mã mới sau."
        reasonLabel="Lý do tắt mã"
        confirmLabel="Tắt mã"
        confirmVariant="danger"
        target={active && scope ? { title: active.code, subtitle: scope.name } : null}
        isLoading={disable.isPending}
        error={disable.error?.message}
        onConfirm={async (reason) => {
          if (!active) return;
          // Lỗi giữ dialog mở và hiện ngay trong dialog (prop `error`), không đóng như khi thành công.
          await disable.mutateAsync({ id: active.id, reason }).then(() => setConfirm(null), () => undefined);
        }}
      />
    </>
  );
}
