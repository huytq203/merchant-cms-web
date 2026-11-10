// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { TerminalFilters } from "../TerminalFilters";

function renderFilters(onSearch = vi.fn()) {
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TerminalFilters initial={{}} onSearch={onSearch} />
    </QueryClientProvider>,
  );
  return onSearch;
}

afterEach(cleanup);

describe("terminal filters", () => {
  it("searches when Enter is pressed in the name field", async () => {
    const onSearch = renderFilters();
    await userEvent.type(screen.getByRole("textbox", { name: /Tên Terminal/ }), "Quầy 1{Enter}");
    expect(onSearch).toHaveBeenCalledWith({ name: "Quầy 1" });
  });

  it("submits through the search button and clears without submitting", async () => {
    const onSearch = renderFilters();
    await userEvent.type(screen.getByRole("textbox", { name: /Tên Terminal/ }), "Quầy 1");
    expect(screen.getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
    await userEvent.click(screen.getByRole("button", { name: "Xóa lọc" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith({});
    expect(screen.getByRole("textbox", { name: /Tên Terminal/ })).toHaveValue("");
  });

  it("filters by terminal type together with the other fields", async () => {
    const onSearch = renderFilters();
    await userEvent.click(screen.getByRole("combobox", { name: /Loại terminal/ }));
    await userEvent.click(await screen.findByRole("option", { name: "QR" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(onSearch).toHaveBeenCalledWith({ terminalType: "QR" });
  });
});
