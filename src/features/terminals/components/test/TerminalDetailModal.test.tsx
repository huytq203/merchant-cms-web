// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TerminalDetailModal } from "../TerminalDetailModal";
import type { TerminalDetail } from "../../types";

const detail: TerminalDetail = {
  id: "33333333-3333-4333-8333-333333333333",
  tid: "TML000001",
  name: "Quầy 1",
  terminalType: "ONLINE",
  address: null,
  status: "INACTIVE",
  lockSource: "DIRECT",
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  subMerchantCode: "SM001",
  subMerchantName: "Điểm bán",
  merchantId: "22222222-2222-4222-8222-222222222222",
  contactPhone: null,
  createdAt: null,
  contactPerson: null,
  note: null,
};

afterEach(cleanup);

describe("terminal detail modal", () => {
  it("shows readable type and status instead of raw enum codes", () => {
    render(<TerminalDetailModal open onOpenChange={vi.fn()} detail={detail} />);
    expect(screen.queryByText("ONLINE")).not.toBeInTheDocument();
    expect(screen.queryByText("INACTIVE")).not.toBeInTheDocument();
    expect(screen.getByText("TML000001")).toBeInTheDocument();
  });

  it("reports a load error and no loading indicator", () => {
    render(<TerminalDetailModal open onOpenChange={vi.fn()} error="Không tải được" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("terminal detail modal layout", () => {
  const active = { ...detail, status: "ACTIVE" as const, lockSource: null, terminalType: "QR" as const, subMerchantName: "Halo Tech", contactPerson: "Nguyễn Văn An", note: "Đặt tại quầy tầng 1", contactPhone: { value: "0912345678", source: "SUB_MERCHANT", inherited: true, suspended: false } };

  it("leads with the terminal name, code, a status badge and the type", () => {
    render(<TerminalDetailModal open onOpenChange={vi.fn()} detail={active} />);
    expect(screen.getByRole("heading", { name: "Quầy 1" })).toBeInTheDocument();
    expect(screen.getByText("TML000001")).toBeInTheDocument();
    expect(screen.getByText("Đang hoạt động")).toBeInTheDocument();
    expect(screen.getByText("QR")).toBeInTheDocument();
  });

  it("says where an inherited phone comes from and shows the note", () => {
    render(<TerminalDetailModal open onOpenChange={vi.fn()} detail={active} />);
    expect(screen.getByText("0912345678")).toBeInTheDocument();
    expect(screen.getByText("Dùng số của Sub-merchant")).toBeInTheDocument();
    expect(screen.getByText("Đặt tại quầy tầng 1")).toBeInTheDocument();
  });

  it("offers edit and lock from inside the dialog, and unlock for a locked terminal", async () => {
    const onEdit = vi.fn();
    const onLock = vi.fn();
    const { rerender } = render(<TerminalDetailModal open onOpenChange={vi.fn()} detail={active} onEdit={onEdit} onLock={onLock} />);
    await userEvent.click(screen.getByRole("button", { name: "Sửa" }));
    await userEvent.click(screen.getByRole("button", { name: "Khóa Terminal" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onLock).toHaveBeenCalledTimes(1);
    const onUnlock = vi.fn();
    rerender(<TerminalDetailModal open onOpenChange={vi.fn()} detail={{ ...active, status: "INACTIVE", lockSource: "DIRECT" }} onLock={onLock} onUnlock={onUnlock} />);
    expect(screen.queryByRole("button", { name: "Khóa Terminal" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mở khóa" }));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});
