// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/http/api-client";
import { ModuleQueryError } from "../ModuleQueryError";
import { SampleDataBanner } from "../SampleDataBanner";

afterEach(cleanup);

describe("ModuleQueryError", () => {
  it("explains an unsupported module without offering a retry", () => {
    render(<ModuleQueryError error={new ApiError(501, "Chức năng chưa được hỗ trợ")} onRetry={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Chưa hỗ trợ");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the failure message and lets the user retry", async () => {
    const onRetry = vi.fn();
    render(<ModuleQueryError error={new ApiError(502, "Hệ thống đang gặp sự cố")} onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Hệ thống đang gặp sự cố");
    await userEvent.click(screen.getByRole("button", { name: /thử lại/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("SampleDataBanner", () => {
  it("announces that the page shows sample data", () => {
    render(<SampleDataBanner />);
    expect(screen.getByRole("status")).toHaveTextContent("Dữ liệu minh hoạ");
  });
});
