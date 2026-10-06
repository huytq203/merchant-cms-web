// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import NotFound from "./not-found";

afterEach(cleanup);

describe("NotFound", () => {
  it("đưa người dùng về dashboard bằng một liên kết không lồng trong nút", () => {
    render(<NotFound />);

    const link = screen.getByRole("link", { name: /trang chủ/i });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link.closest("button")).toBeNull();
  });
});
