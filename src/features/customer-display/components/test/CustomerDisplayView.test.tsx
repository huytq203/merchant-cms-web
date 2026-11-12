// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CustomerDisplay } from "../../schemas";
import { CustomerDisplayView, type CustomerDisplayViewProps } from "../CustomerDisplayView";

afterEach(cleanup);

// Vitest trả ảnh import tĩnh dạng chuỗi (không có kích thước như khi Next build), nên thay next/image bằng <img> thường.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string | { src: string }; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- chỉ dùng trong test
    <img src={typeof src === "string" ? src : src.src} alt={alt} />
  ),
}));

const now = new Date("2026-11-12T10:00:00+07:00");
const order: CustomerDisplay = {
  displayToken: "tok",
  kind: "ORDER",
  qrPayload: "000201010212",
  shop: { name: "Halo tech", terminalName: "Quầy 01" },
  orderCode: "DH-1",
  displayCode: "DH-1",
  amount: 150_000,
  fee: 1_500,
  feeBearer: "MERCHANT",
  payableAmount: 150_000,
  expiresAt: "2026-11-12T10:14:05",
};

function renderView(overrides: Partial<CustomerDisplayViewProps> = {}) {
  const props: CustomerDisplayViewProps = {
    status: "ready",
    display: order,
    phase: "waiting",
    payment: null,
    offline: false,
    error: null,
    now,
    seed: "o1",
    onRetry: vi.fn(),
    ...overrides,
  };
  render(<CustomerDisplayView {...props} />);
  return props;
}

describe("CustomerDisplayView", () => {
  it("shows the shop, the amount, the QR and the time left of an order", () => {
    renderView();
    expect(screen.getByText("Halo tech · Quầy 01")).toBeInTheDocument();
    expect(screen.getByText("150.000")).toBeInTheDocument();
    expect(screen.getByTitle("Mã QR thanh toán đơn DH-1")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("14:05");
  });

  it("hides the fee line when the merchant bears the fee", () => {
    renderView();
    expect(screen.queryByText("1.500đ")).not.toBeInTheDocument();
    expect(screen.getByText("150.000")).toBeInTheDocument();
  });

  it("breaks a customer-paid fee into order + fee = total", () => {
    renderView({ display: { ...order, fee: 2_200, feeBearer: "SENDER", payableAmount: 152_200 } });
    expect(screen.getByText("152.200")).toBeInTheDocument();
    expect(screen.getByText("150.000đ")).toBeInTheDocument();
    expect(screen.getByText("2.200đ")).toBeInTheDocument();
  });

  it("asks the customer to type the amount on a static code and offers only the FlexPay wallet", () => {
    renderView({ display: { ...order, kind: "STATIC_QR", orderCode: null, code: "SQABC", displayCode: "SQABC", amount: null, fee: null, feeBearer: null, payableAmount: null, expiresAt: null } });
    expect(screen.getByTitle("Mã QR thanh toán của quầy")).toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByText("App ngân hàng")).not.toBeInTheDocument();
  });

  it("replaces the QR with the success receipt once paid", () => {
    renderView({ phase: "paid", payment: { status: "PAID", paidAt: "2026-11-12T10:01:00", paidAmount: 150_000, paymentMethod: "FLEXPAY_WALLET" } });
    expect(screen.getByRole("status")).toHaveTextContent("Thanh toán thành công");
    expect(screen.getByRole("status")).toHaveTextContent("Ví FlexPay");
    expect(screen.getByRole("status")).toHaveTextContent("10:01 · 12/11/2026");
    expect(screen.queryByTitle(/Mã QR/)).not.toBeInTheDocument();
  });

  it("hides a closed code so nobody scans it", () => {
    renderView({ phase: "closed" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByTitle(/Mã QR/)).not.toBeInTheDocument();
  });

  it("asks the cashier to reopen a static display that was closed", () => {
    renderView({ phase: "closed", display: { ...order, kind: "STATIC_QR", expiresAt: null } });
    expect(screen.getByRole("alert")).toHaveTextContent("mở lại màn hiển thị");
  });

  it("does not draw an empty QR when the order has none yet", () => {
    renderView({ display: { ...order, qrPayload: null } });
    expect(screen.queryByTitle(/Mã QR/)).not.toBeInTheDocument();
  });

  it("offers a retry when the display could not open", async () => {
    const props = renderView({ status: "error", display: null, error: "Đơn hàng không còn chờ thanh toán" });
    expect(screen.getByRole("alert")).toHaveTextContent("Đơn hàng không còn chờ thanh toán");
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("warns softly when polling lost the connection", () => {
    renderView({ offline: true });
    expect(screen.getByText("Mất kết nối, đang thử lại…")).toHaveAttribute("role", "status");
  });
});
