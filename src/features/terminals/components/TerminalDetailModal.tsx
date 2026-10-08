"use client";

import { DetailItem, DetailList, DetailModal, DetailSection } from "@/components/modal";
import type { TerminalDetail } from "../types";
import { terminalStatusLabel, terminalTypeLabel } from "../utils/terminal-mapper";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; detail?: TerminalDetail | null; error?: string; title?: string; };

function TerminalFields({ detail }: { detail: TerminalDetail }) {
  return <DetailSection title="Thông tin terminal"><DetailList><DetailItem label="Tên">{detail.name}</DetailItem><DetailItem label="Loại">{terminalTypeLabel(detail.terminalType)}</DetailItem><DetailItem label="Trạng thái">{terminalStatusLabel(detail)}</DetailItem><DetailItem label="Sub-merchant">{detail.subMerchantName ?? detail.subMerchantCode}</DetailItem><DetailItem label="Người liên hệ">{detail.contactPerson || "Chưa có"}</DetailItem><DetailItem label="Địa chỉ" wide>{detail.address || "Chưa có"}</DetailItem><DetailItem label="Số điện thoại" wide>{detail.contactPhone?.value || "Chưa có"}</DetailItem></DetailList></DetailSection>;
}

export function TerminalDetailModal({ open, onOpenChange, detail, error, title = "Chi tiết Terminal" }: Props) {
  return <DetailModal open={open} onOpenChange={onOpenChange} header={{ monogramInitials: detail?.name ?? "TT", title, code: detail?.tid ?? "Chưa có mã" }} sections={error ? <p role="alert" className="text-sm text-danger">{error}</p> : detail ? <TerminalFields detail={detail} /> : <p role="status">Đang tải chi tiết...</p>} />;
}
