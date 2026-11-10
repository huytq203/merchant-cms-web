// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { SubMerchantFilterField } from "../SubMerchantFilterField";

afterEach(cleanup);

const SUB = { id: "5dcda5e6-afd1-4201-a02f-7187164f0f86", name: "Halo Láng", code: "MC000001-S001", status: "ACTIVE" };

function renderField(props: { value: string; allowAll?: boolean }) {
  const onChange = vi.fn();
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [SUB], total: 1 })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SubMerchantFilterField {...props} onChange={onChange} />
    </QueryClientProvider>,
  );
  return onChange;
}

describe("SubMerchantFilterField allowAll", () => {
  it("offers 'Tất cả sub-merchant' and reports an empty value when it is picked", async () => {
    const onChange = renderField({ value: SUB.id, allowAll: true });
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Tất cả sub-merchant" }));
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("does not add the option by default", async () => {
    renderField({ value: "" });
    await userEvent.click(screen.getByRole("combobox"));
    await screen.findByRole("option", { name: "Halo Láng" });
    expect(screen.queryByRole("option", { name: "Tất cả sub-merchant" })).not.toBeInTheDocument();
  });
});
