// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccessDenied } from "./access-denied";

afterEach(cleanup);

describe("AccessDenied", () => {
  it("là một vùng có tiêu đề, không phải alert", () => {
    render(<AccessDenied />);

    const region = screen.getByRole("region", { name: screen.getByRole("heading", { level: 1 }).textContent ?? "" });
    expect(region).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("đưa người dùng về dashboard bằng một liên kết hợp lệ", () => {
    render(<AccessDenied />);

    const link = screen.getByRole("link", { name: /trang chủ/i });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link.closest("button")).toBeNull();
    expect(link.querySelector("button, a")).toBeNull();
  });
});
