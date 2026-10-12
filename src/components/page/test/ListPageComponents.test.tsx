// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Eye, Pencil } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterCard } from "../FilterCard";
import { getIndexValue } from "../IndexColumn";
import { ResultState } from "../ResultState";
import { RowActions } from "../RowActions";
import { StatusBadge } from "../StatusBadge";

afterEach(cleanup);

describe("FilterCard", () => {
  it("submits with Enter and exposes accessible actions", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FilterCard fieldCount={2} onSubmit={onSubmit} onClear={vi.fn()}>
        <label>Tên<input /></label>
        <label>Trạng thái<select><option>Tất cả trạng thái</option></select></label>
      </FilterCard>,
    );

    await user.type(screen.getByRole("textbox", { name: "Tên" }), "Cửa hàng");
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Xóa lọc" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Tìm kiếm" })).toBeEnabled();
  });

  it("keeps up to three fields and actions in one wrapped flex row", () => {
    render(
      <FilterCard fieldCount={3} onSubmit={vi.fn()}>
        <label>Một<input /></label>
        <label>Hai<input /></label>
        <label>Ba<input /></label>
      </FilterCard>,
    );

    const form = screen.getByRole("form");
    const row = form.firstElementChild;
    const actions = screen.getByRole("button", { name: "Tìm kiếm" }).parentElement;

    expect(form).toHaveAttribute("data-layout", "inline");
    expect(row).toHaveClass("flex", "flex-wrap", "items-end");
    expect(actions).toHaveClass("ml-auto");
  });

  it("moves actions below a four-field responsive grid", () => {
    render(
      <FilterCard fieldCount={4} onSubmit={vi.fn()}>
        <label>Một<input /></label>
        <label>Hai<input /></label>
        <label>Ba<input /></label>
        <label>Bốn<input /></label>
      </FilterCard>,
    );

    const form = screen.getByRole("form");
    const grid = form.firstElementChild;
    const actions = screen.getByRole("button", { name: "Tìm kiếm" }).parentElement;

    expect(form).toHaveAttribute("data-layout", "grid");
    expect(grid).toHaveClass("grid", "@md:grid-cols-2", "@3xl:grid-cols-4");
    expect(actions).toHaveClass("justify-end");
  });

  it("sizes its columns by the width of the card, not of the window", () => {
    const { container } = render(
      <FilterCard fieldCount={4} onSubmit={vi.fn()}>
        <label>Một<input /></label>
        <label>Hai<input /></label>
        <label>Ba<input /></label>
        <label>Bốn<input /></label>
      </FilterCard>,
    );

    expect(container.firstElementChild).toHaveClass("@container");
  });

  it("can place the actions as the last cell of the grid, so an odd field count leaves no gap", () => {
    render(
      <FilterCard fieldCount={7} actionsInGrid onSubmit={vi.fn()}>
        {Array.from({ length: 7 }, (_, index) => <label key={index}>Ô {index}<input /></label>)}
      </FilterCard>,
    );

    const grid = screen.getByRole("form").firstElementChild;
    const actions = screen.getByRole("button", { name: "Tìm kiếm" }).parentElement;

    expect(actions?.parentElement).toBe(grid);
    expect(grid?.lastElementChild).toBe(actions);
  });
});

describe("ResultState", () => {
  it("renders loading, error recovery, and empty CTA states", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    const { rerender } = render(<ResultState state="loading" />);
    expect(screen.getByLabelText("Đang tải dữ liệu")).toBeInTheDocument();

    rerender(<ResultState state="error" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<ResultState state="empty" action={<button type="button">Tạo mới</button>} />);
    expect(screen.getByRole("button", { name: "Tạo mới" })).toBeInTheDocument();
  });
});

describe("IndexColumn", () => {
  it("keeps index values continuous across pages", () => {
    expect(getIndexValue(1, 10, 0)).toBe(1);
    expect(getIndexValue(3, 10, 4)).toBe(25);
  });
});

describe("RowActions", () => {
  it("hides unauthorized actions and explains disabled actions", async () => {
    const user = userEvent.setup();

    render(
      <RowActions
        subject="Điểm bán Hà Nội"
        actions={[
          { label: "Xem chi tiết", icon: <Eye />, onClick: vi.fn() },
          { label: "Sửa", icon: <Pencil />, visible: false, onClick: vi.fn() },
          { label: "Mở khóa", icon: <Pencil />, disabled: true, disabledReason: "Bị khóa theo Master" },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Xem chi tiết Điểm bán Hà Nội" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Sửa Điểm bán Hà Nội" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem chi tiết Điểm bán Hà Nội" }).closest("div")?.children).toHaveLength(2);

    const disabledAction = screen.getByRole("button", { name: "Mở khóa Điểm bán Hà Nội" });
    expect(disabledAction).toBeDisabled();
    await user.hover(disabledAction.parentElement!);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Bị khóa theo Master");
  });
});

describe("StatusBadge", () => {
  it("uses the Vietnamese fallback for an unknown status", () => {
    render(<StatusBadge />);
    expect(screen.getByText("Không xác định")).toBeInTheDocument();
  });
});
