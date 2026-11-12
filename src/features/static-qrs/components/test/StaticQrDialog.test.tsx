// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { StaticQrDialog } from "../StaticQrDialog";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const root = "/api/v1/admin/static-qrs";
const sub = "55555555-5555-4555-8555-555555555555";
const terminal = "77777777-7777-4777-8777-777777777777";
const qr = {
  id: "88888888-8888-4888-8888-888888888888",
  subMerchantId: sub,
  terminalId: terminal,
  code: "SQABCDEFGHIJ",
  qrPayload: "000201010211",
  version: 1,
  status: "ACTIVE",
  effectiveFrom: "2026-11-12T10:00:00",
};
const scope = { subMerchantId: sub, terminalId: terminal, name: "Terminal Quầy 01 (T001)" };

function renderDialog(canManage = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StaticQrDialog scope={scope} canManage={canManage} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

let listed: unknown[] = [];
beforeEach(() => {
  listed = [qr];
  mswServer.use(http.get(root, () => HttpResponse.json(listed)));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StaticQrDialog", () => {
  it("shows the active code of the Terminal and opens its customer display", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderDialog();
    expect(await screen.findByTitle("Mã QR tĩnh SQABCDEFGHIJ")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Hiển thị QR tĩnh/ }));
    expect(open).toHaveBeenCalledWith(`/customer-display/static-qr/${qr.id}`, "_blank", "noopener");
  });

  it("ignores the Sub-level code when the dialog is for a Terminal", async () => {
    listed = [{ ...qr, terminalId: null }];
    renderDialog();
    expect(await screen.findByRole("button", { name: /Tạo mã QR tĩnh/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hiển thị QR tĩnh/ })).not.toBeInTheDocument();
  });

  it("creates a code for the Terminal when none exists", async () => {
    listed = [];
    let body: unknown;
    mswServer.use(http.post(root, async ({ request }) => {
      body = await request.json();
      listed = [qr];
      return HttpResponse.json(qr, { status: 201 });
    }));
    renderDialog();
    await userEvent.click(await screen.findByRole("button", { name: /Tạo mã QR tĩnh/ }));
    expect(body).toEqual({ subMerchantId: sub, terminalId: terminal });
    expect(await screen.findByTitle("Mã QR tĩnh SQABCDEFGHIJ")).toBeInTheDocument();
  });

  it("lets a view-only user display the code but not change it", async () => {
    renderDialog(false);
    await screen.findByTitle("Mã QR tĩnh SQABCDEFGHIJ");
    expect(screen.getByRole("button", { name: /Hiển thị QR tĩnh/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đổi mã/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tắt mã/ })).not.toBeInTheDocument();
  });

  it("rotates only after confirmation", async () => {
    const rotated = vi.fn(() => HttpResponse.json({ ...qr, id: "99999999-9999-4999-8999-999999999999", version: 2 }));
    mswServer.use(http.post(`${root}/${qr.id}/rotate`, rotated));
    renderDialog();
    await userEvent.click(await screen.findByRole("button", { name: /Đổi mã/ }));
    expect(rotated).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole("button", { name: "Đổi mã" }));
    await waitFor(() => expect(rotated).toHaveBeenCalledTimes(1));
  });
});
