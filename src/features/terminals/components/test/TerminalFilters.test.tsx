// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { TerminalFilters } from "../TerminalFilters";

const subs = [
  { id: "11111111-1111-4111-8111-111111111111", code: "S1", name: "Quầy Một", status: "ACTIVE" },
  { id: "22222222-2222-4222-8222-222222222222", code: "S2", name: "Quầy Hai", status: "ACTIVE" },
  { id: "33333333-3333-4333-8333-333333333333", code: "S3", name: "Quầy Ba", status: "ACTIVE" },
];

function renderFilters(onSearch = vi.fn()) {
  mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json(subs)));
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

  it("searches by several Sub-merchants at once", async () => {
    const onSearch = renderFilters();
    await userEvent.click(screen.getByRole("button", { name: /Sub-merchant/ }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Quầy Một/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Quầy Ba/ }));
    await userEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(onSearch).toHaveBeenCalledWith({ subMerchantIds: [subs[0]!.id, subs[2]!.id] });
  });

  it("filters by terminal type together with the other fields", async () => {
    const onSearch = renderFilters();
    await userEvent.click(screen.getByRole("combobox", { name: /Loại terminal/ }));
    await userEvent.click(await screen.findByRole("option", { name: "QR" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(onSearch).toHaveBeenCalledWith({ terminalType: "QR" });
  });
});
