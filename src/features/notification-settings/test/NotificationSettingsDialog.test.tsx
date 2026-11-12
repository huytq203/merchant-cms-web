// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { SessionProvider } from "@/features/auth/components/session-provider";
import type { SessionUser } from "@/types/auth";
import { NotificationSettingsDialog } from "../NotificationSettingsDialog";

afterEach(cleanup);

const SUB_A = "00000000-0000-4000-8000-00000000000a";
const SUB_B = "00000000-0000-4000-8000-00000000000b";
const CONFIG_URL = "/api/v1/admin/notification-config";

const session = (extra: Partial<SessionUser>): SessionUser => ({
  userId: "u", username: "An", status: "ACTIVE", merchantIds: [], merchants: [], subMerchantIds: [],
  permissions: ["MANAGE_NOTIFICATION"], authorizationVersion: 1, ...extra,
});

const config = (over: Record<string, unknown> = {}) => ({
  externalChannelsEnabled: true,
  externalChannels: [
    { kind: "PAYMENT_RESULT", label: "Kết quả thanh toán", emailMandatory: false, channels: ["EMAIL", "SMS"] },
    { kind: "SECURITY", label: "Bảo mật", emailMandatory: true, channels: ["EMAIL"] },
    { kind: "WITHDRAWAL", label: "Rút tiền", emailMandatory: false, channels: [] },
  ],
  notificationEmails: ["ketoan@abc.vn", "ceo@abc.vn"],
  ...over,
});

function renderDialog(user: SessionUser) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SessionProvider session={user}><NotificationSettingsDialog open onOpenChange={() => undefined} /></SessionProvider>
    </QueryClientProvider>,
  );
}

function serve(body: Record<string, unknown>, status = 200) {
  const requests: string[] = [];
  mswServer.use(http.get(CONFIG_URL, ({ request }) => { requests.push(new URL(request.url).search); return HttpResponse.json(body, { status }); }));
  return requests;
}

const row = (name: string) => screen.getByRole("row", { name: new RegExp(name) });
const ticked = (r: HTMLElement) => within(r).queryAllByLabelText("Có").length;

describe("NotificationSettingsDialog", () => {
  it("shows the switch, the group ticks, the emails and the contact note, read only", async () => {
    serve(config());
    renderDialog(session({ merchantIds: ["m1"] }));
    expect(await screen.findByText("Cài đặt thông báo")).toBeInTheDocument();
    expect(await screen.findByText("Kết quả thanh toán")).toBeInTheDocument();
    expect(ticked(row("Kết quả thanh toán"))).toBe(2);
    expect(ticked(row("Bảo mật"))).toBe(1);
    expect(ticked(row("Rút tiền"))).toBe(0);
    expect(screen.getByText("ketoan@abc.vn")).toBeInTheDocument();
    expect(screen.getByText("ceo@abc.vn")).toBeInTheDocument();
    expect(screen.getByText("Liên hệ FlexPay để thay đổi cấu hình.")).toBeInTheDocument();
    // Không có ô nhập hay công tắc nào bật được.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    const switches = screen.queryAllByRole("switch");
    expect(switches.length).toBeGreaterThan(0);
    for (const control of switches) expect(control).toHaveAttribute("aria-disabled", "true");
  });

  it("calls the Master level without a Sub for a Master grant", async () => {
    const requests = serve(config());
    renderDialog(session({ merchantIds: ["m1"], subMerchantIds: [SUB_A] }));
    await screen.findByText("Kết quả thanh toán");
    expect(requests).toEqual([""]);
  });

  it("passes the only Sub of a Sub-scoped user", async () => {
    const requests = serve(config());
    renderDialog(session({ subMerchantIds: [SUB_A] }));
    await screen.findByText("Kết quả thanh toán");
    expect(requests).toEqual([`?subMerchantId=${SUB_A}`]);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("lets a user with several Subs pick one and reloads for it", async () => {
    mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([
      { id: SUB_A, code: "A", name: "Chi nhánh A", status: "ACTIVE" },
      { id: SUB_B, code: "B", name: "Chi nhánh B", status: "ACTIVE" },
    ])));
    const requests = serve(config());
    renderDialog(session({ subMerchantIds: [SUB_A, SUB_B] }));
    await waitFor(() => expect(requests).toEqual([`?subMerchantId=${SUB_A}`]));
    const user = userEvent.setup();
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Chi nhánh B/ }));
    await waitFor(() => expect(requests).toContain(`?subMerchantId=${SUB_B}`));
  });

  it("greys out the table and keeps only the mandatory email tick when external channels are off", async () => {
    serve(config({ externalChannelsEnabled: false }));
    renderDialog(session({ merchantIds: ["m1"] }));
    await screen.findByText("Kết quả thanh toán");
    expect(screen.getByText("Đang tắt gửi qua kênh ngoài web — chỉ còn email bắt buộc.")).toBeInTheDocument();
    expect(ticked(row("Kết quả thanh toán"))).toBe(0);
    expect(ticked(row("Bảo mật"))).toBe(1);
    expect(screen.getByTestId("notification-config-table")).toHaveAttribute("data-disabled", "true");
  });

  it("shows the server message when the config cannot be loaded", async () => {
    serve({ message: "Không tìm thấy cấu hình thông báo." }, 404);
    renderDialog(session({ merchantIds: ["m1"] }));
    expect(await screen.findByText("Không tìm thấy cấu hình thông báo.")).toBeInTheDocument();
  });
});
