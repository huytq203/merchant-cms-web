// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PasswordChecklist } from "@/features/auth/components/password-checklist";

afterEach(cleanup);

const list = () => screen.getByRole("list", { name: "Yêu cầu mật khẩu" });
const rule = (name: RegExp) => within(list()).getByText(name).closest("li") as HTMLElement;

describe("PasswordChecklist", () => {
  it("counts how many of the five conditions are met", () => {
    const { rerender } = render(<PasswordChecklist value="" />);
    expect(screen.getByText(/Mật khẩu cần đạt đủ 5 điều kiện/)).toHaveTextContent("(0/5)");
    rerender(<PasswordChecklist value="Abcdefghi1" />);
    expect(screen.getByText(/Mật khẩu cần đạt đủ 5 điều kiện/)).toHaveTextContent("(4/5)");
    rerender(<PasswordChecklist value="Abcdefghi1@" />);
    expect(screen.getByText(/Mật khẩu cần đạt đủ 5 điều kiện/)).toHaveTextContent("(5/5)");
  });

  it("lists each requirement once", () => {
    render(<PasswordChecklist value="" />);
    expect(within(list()).getAllByRole("listitem")).toHaveLength(5);
    expect(within(list()).getAllByText(/@\$!%\*\?&/)).toHaveLength(1);
  });

  it("marks a requirement as met only when the password satisfies it", () => {
    render(<PasswordChecklist value="Abcdefghi1" />);
    expect(rule(/Ít nhất 10 ký tự/)).toHaveTextContent("đã đạt");
    expect(rule(/chữ hoa/)).toHaveTextContent("đã đạt");
    expect(rule(/ký tự đặc biệt/)).toHaveTextContent("chưa đạt");
  });

  it("counts a special character as met without a second line saying the same", () => {
    render(<PasswordChecklist value="Abcdefghi1@" />);
    expect(rule(/ký tự đặc biệt/)).toHaveTextContent("đã đạt");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("warns about a character that is not allowed only when one is typed", () => {
    const { rerender } = render(<PasswordChecklist value="Abcdefghi1@" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    rerender(<PasswordChecklist value="Abcdefghi1@ " />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Chỉ dùng chữ, số và @\$!%\*\?&/);
  });
});
