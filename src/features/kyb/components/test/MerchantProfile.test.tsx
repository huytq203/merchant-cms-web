// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { KybContainer } from "../KybContainer";
import type { EnterpriseWallet, MerchantProfile } from "../../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const merchantId = "11111111-1111-4111-8111-111111111111";
const walletId = "22222222-2222-4222-8222-222222222222";
const base = "/api/v1/admin/kyb";

const verifiedWallet: EnterpriseWallet = {
  id: walletId,
  registeredEmail: "owner@example.com",
  verificationStatus: "VERIFIED",
  bankLinkStatus: "BANK_LINKED",
  legalName: "Công ty A",
  legalRepresentativeName: "Nguyễn A",
};

function serve(profile: MerchantProfile) {
  mswServer.use(
    http.get(`${base}/merchants/${merchantId}`, () => HttpResponse.json(profile)),
    http.get(`${base}/merchants/${merchantId}/status-history`, () => HttpResponse.json({
      rows: [{ toStatus: "PENDING_APPROVAL", occurredAt: "2026-01-09T11:24:00" }],
      total: 1,
    })),
  );
}

function profileOf(status: MerchantProfile["status"], wallet: EnterpriseWallet = verifiedWallet): MerchantProfile {
  return { id: merchantId, status, name: "Quán A", enterpriseWalletId: walletId, enterpriseWallet: wallet };
}

function renderContainer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <KybContainer merchantId={merchantId} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ĐVCNTT profile", () => {
  it("locks the form while a registration condition is unmet", async () => {
    serve(profileOf("DRAFT", { ...verifiedWallet, bankLinkStatus: "BANK_UNLINKED" }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Đăng ký ĐVCNTT" }));
    expect(await screen.findByLabelText(/Mã ngành nghề/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Gửi duyệt" })).toBeDisabled();
  });

  it("saves then submits, without an admin password", async () => {
    const calls: string[] = [];
    let body: Record<string, unknown> = {};
    serve(profileOf("DRAFT"));
    mswServer.use(
      http.put(`${base}/merchants/${merchantId}`, async ({ request }) => {
        calls.push("save");
        body = await request.json() as Record<string, unknown>;
        return HttpResponse.json(profileOf("DRAFT"));
      }),
      http.post(`${base}/merchants/${merchantId}/submit`, () => {
        calls.push("submit");
        return HttpResponse.json(profileOf("PENDING_APPROVAL"));
      }),
    );
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Đăng ký ĐVCNTT" }));
    await userEvent.type(await screen.findByLabelText(/Mã ngành nghề/), "5812");
    await userEvent.type(screen.getByLabelText(/Người liên hệ/), "0912345678");
    await userEvent.click(screen.getByRole("button", { name: "Gửi duyệt" }));
    await waitFor(() => expect(calls).toEqual(["save", "submit"]));
    expect(body).toMatchObject({ mccCode: "5812", name: "Quán A", supportContact: "0912345678" });
    expect(body).not.toHaveProperty("adminPassword");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows field errors and does not call the server when required values are missing", async () => {
    let called = false;
    serve(profileOf("DRAFT"));
    mswServer.use(http.put(`${base}/merchants/${merchantId}`, () => {
      called = true;
      return HttpResponse.json(profileOf("DRAFT"));
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Đăng ký ĐVCNTT" }));
    await userEvent.click(await screen.findByRole("button", { name: "Gửi duyệt" }));
    expect(await screen.findByText("Nhập mã MCC")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("keeps the dialog open and shows the BE message when submit fails", async () => {
    serve(profileOf("DRAFT"));
    mswServer.use(
      http.put(`${base}/merchants/${merchantId}`, () => HttpResponse.json(profileOf("DRAFT"))),
      http.post(`${base}/merchants/${merchantId}/submit`, () =>
        HttpResponse.json({ message: "Chưa liên kết ngân hàng" }, { status: 409 })),
    );
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Đăng ký ĐVCNTT" }));
    await userEvent.type(await screen.findByLabelText(/Mã ngành nghề/), "5812");
    await userEvent.type(screen.getByLabelText(/Người liên hệ/), "0912345678");
    await userEvent.click(screen.getByRole("button", { name: "Gửi duyệt" }));
    expect(await screen.findByText("Chưa liên kết ngân hàng")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows read-only progress while pending, with no edit action", async () => {
    serve(profileOf("PENDING_APPROVAL"));
    renderContainer();
    expect((await screen.findAllByRole("listitem")).length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByRole("button", { name: "Đăng ký ĐVCNTT" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chỉnh sửa và gửi lại" })).not.toBeInTheDocument();
  });

  it("shows the rejection reason and lets the user edit and resubmit", async () => {
    serve({ ...profileOf("REJECTED"), rejectedReasonDetail: "Website không hợp lệ" });
    renderContainer();
    expect(await screen.findAllByText("Website không hợp lệ")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "Chỉnh sửa và gửi lại" })).toBeInTheDocument();
  });
});
