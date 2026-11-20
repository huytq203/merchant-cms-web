// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UnconfirmedOrderNotice } from "../UnconfirmedOrderNotice";

afterEach(cleanup);

describe("UnconfirmedOrderNotice", () => {
  it("always offers the lookup but hides 'create another' before the first lookup", () => {
    const onLookup = vi.fn();
    render(<UnconfirmedOrderNotice onLookup={onLookup} isLookingUp={false} canAbandon={false} onAbandon={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Tra lại lệnh theo mã yêu cầu" }));
    expect(onLookup).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Tạo lệnh khác" })).not.toBeInTheDocument();
  });

  it("asks for a second, warned confirmation before abandoning the unconfirmed order", () => {
    const onAbandon = vi.fn();
    render(<UnconfirmedOrderNotice onLookup={vi.fn()} isLookingUp={false} canAbandon onAbandon={onAbandon} />);
    fireEvent.click(screen.getByRole("button", { name: "Tạo lệnh khác" }));
    expect(onAbandon).not.toHaveBeenCalled();
    expect(screen.getByText(/chi hai lần/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Vẫn tạo lệnh khác" }));
    expect(onAbandon).toHaveBeenCalledTimes(1);
  });
});
