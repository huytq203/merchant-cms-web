// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dehydrate, HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { format } from "date-fns";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { auditLogQueries } from "../../audit-log-queries";
import type { AuditLog } from "../../types";
import { AuditLogsContainer } from "../AuditLogsContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/audit-logs" }));

const base = "/api/v1/admin/audit-logs";
const reason = "Khóa do vi phạm";
const filter = { page: 1, pageSize: 10, occurredFrom: "2026-09-28T00:00:00", occurredTo: "2026-10-05T00:00:00" };
const row: AuditLog = {
  id: "e13ff927-d5d5-4966-ac07-502f2660487c",
  entityName: "terminals",
  entityId: null,
  action: "LOCK",
  reason,
  actorType: "MERCHANT",
  actorLabel: "alice",
  occurredAt: "2026-10-05T12:34:56",
};
const viewLabel = `Xem chi tiết nhật ký lúc ${format(new Date(row.occurredAt), "HH:mm dd/MM")}`;
let listCalls = 0;

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderContainer(client = newClient(), state?: ReturnType<typeof dehydrate>) {
  return render(
    <QueryClientProvider client={client}>
      <HydrationBoundary state={state}>
        <AuditLogsContainer filter={filter} />
      </HydrationBoundary>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  listCalls = 0;
  mswServer.use(http.get(base, () => {
    listCalls += 1;
    return HttpResponse.json({ rows: [row], total: 1 });
  }));
});
afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("audit log screen", () => {
  it("renders the server-prefetched list from the hydrated cache without requesting it again", async () => {
    const server = newClient();
    server.setQueryData(auditLogQueries.list(filter).queryKey, { rows: [row], total: 1 });
    renderContainer(newClient(), dehydrate(server));
    expect(await screen.findByRole("button", { name: viewLabel })).toBeInTheDocument();
    expect(listCalls).toBe(0);
  });

  it("requests the list endpoint with the filter when nothing was prefetched", async () => {
    let search: URLSearchParams | undefined;
    mswServer.use(http.get(base, ({ request }) => {
      search = new URL(request.url).searchParams;
      return HttpResponse.json({ rows: [row], total: 1 });
    }));
    renderContainer();
    await screen.findByRole("table");
    expect(Object.fromEntries(search!)).toEqual({
      page: "1",
      pageSize: "10",
      occurredFrom: filter.occurredFrom,
      occurredTo: filter.occurredTo,
    });
  });

  it("labels the detail button with the log time, not its id, and explains it in a tooltip", async () => {
    renderContainer();
    const button = await screen.findByRole("button", { name: viewLabel });
    expect(button.getAttribute("aria-label")).not.toContain(row.id);
    await userEvent.hover(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(viewLabel);
  });

  it("shows the actor label and no IP column", async () => {
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("alice")).toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: /IP/ })).not.toBeInTheDocument();
  });

  it("opens a read-only detail loaded from the detail endpoint and shows only the BE fields", async () => {
    let requestedPath: string | undefined;
    mswServer.use(http.get(`${base}/${row.id}`, ({ request }) => {
      requestedPath = new URL(request.url).pathname;
      return HttpResponse.json(row);
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: viewLabel }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText(reason)).toBeInTheDocument();
    expect(within(dialog).getByText("alice")).toBeInTheDocument();
    expect(requestedPath).toBe(`${base}/${row.id}`);
    expect(screen.queryByRole("button", { name: /thêm|sửa|xóa nhật ký/i })).not.toBeInTheDocument();
  });

  it("shows a busy indicator while loading", () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    renderContainer();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("reports an error and recovers on retry", async () => {
    let failing = true;
    mswServer.use(http.get(base, () => (
      failing
        ? HttpResponse.json({ message: "Không tải được" }, { status: 500 })
        : HttpResponse.json({ rows: [row], total: 1 })
    )));
    renderContainer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    failing = false;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("renders no table when there are no logs", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [], total: 0 })));
    renderContainer();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("keeps the custom dates in the URL when searching", async () => {
    renderContainer();
    await screen.findByRole("table");
    // Bộ lọc không có period (link cũ) là Tùy chỉnh: hai ô ngày hiện và đi lên URL khi Tìm kiếm.
    expect(screen.getByRole("button", { name: "Tùy chỉnh" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith(expect.stringContaining("occurredFrom=2026-09-28T00%3A00%3A00"));
    expect(push).toHaveBeenLastCalledWith(expect.stringContaining("period=custom"));
  });

  it("applies a preset period at once and keeps the dates out of the URL", async () => {
    renderContainer();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: "30 ngày" }));
    const url = String(push.mock.lastCall?.[0]);
    expect(url).toContain("period=30d");
    expect(url).not.toContain("occurredFrom");
  });

  it("shows the category pill, the object label and a FlexPay actor without any admin name", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [{
      ...row, entityName: "merchant_revenue_refunds", category: "REFUND", action: "APPROVE", reason: null,
      actorType: "FLEXPAY", actorLabel: "FlexPay", actorDisplayName: "FlexPay",
    }], total: 1 })));
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Nhóm" })).toBeInTheDocument();
    expect(within(table).getByText("Hoàn tiền")).toBeInTheDocument();
    expect(within(table).getByText("Yêu cầu hoàn tiền")).toBeInTheDocument();
    expect(within(table).getByText("Phê duyệt")).toBeInTheDocument();
    expect(within(table).getByText("FlexPay")).toBeInTheDocument();
  });

  it("clears the filter without refilling the date range", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Xóa lọc" }));
    const url = String(push.mock.calls[0]?.[0]);
    expect(url).not.toContain("occurredFrom");
    expect(url).not.toContain("occurredTo");
    expect(url).toContain("period=custom");
  });
});
