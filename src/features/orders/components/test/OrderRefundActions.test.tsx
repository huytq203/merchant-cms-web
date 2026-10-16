// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderRefundActions } from "../OrderRefundActions";

const orderId = "7c1f2a3e-1111-4222-8333-444455556666";
const onRefund = vi.fn();

afterEach(() => {
  cleanup();
  onRefund.mockClear();
});

describe("OrderRefundActions", () => {
  it("offers a refund and the existing requests on a successful order", async () => {
    render(<OrderRefundActions orderId={orderId} status="SUCCESS" canCreate canView onRefund={onRefund} />);
    await userEvent.click(screen.getByRole("button", { name: "Hoàn tiền" }));
    expect(onRefund).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Xem yêu cầu hoàn tiền" })).toHaveAttribute("href", `/revenue-refunds?orderId=${orderId}`);
  });

  it("offers nothing on an order that was not paid", () => {
    const { container } = render(<OrderRefundActions orderId={orderId} status="ACTIVE" canCreate canView onRefund={onRefund} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides each action the session may not use", () => {
    render(<OrderRefundActions orderId={orderId} status="SUCCESS" canCreate={false} canView onRefund={onRefund} />);
    expect(screen.queryByRole("button", { name: "Hoàn tiền" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem yêu cầu hoàn tiền" })).toBeInTheDocument();
  });
});
