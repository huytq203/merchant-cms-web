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
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const merchantId = "11111111-1111-4111-8111-111111111111";
const walletId = "22222222-2222-4222-8222-222222222222";
const base = "/api/v1/admin/kyb";

const verifiedWallet: EnterpriseWallet = {
  id: walletId,
  registeredEmail: "owner@example.com",
  verificationStatus: "VERIFIED",
  bankLinkStatus: "BANK_LINKED",
  businessType: "ENTERPRISE",
  taxCode: "0312345678",
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

async function pickIndustry() {
  await userEvent.click(await screen.findByRole("combobox", { name: /Ngành nghề kinh doanh/ }));
  await userEvent.click(await screen.findByRole("option", { name: /5812/ }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ĐVCNTT profile", () => {
  it("opens on the ĐVCNTT tab once KYB is verified and shows the form with the owner's data read only", async () => {
    serve(profileOf("DRAFT"));
    renderContainer();
    expect(await screen.findByRole("button", { name: "Gửi duyệt" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Điều kiện đăng ký" }).querySelectorAll("li")).toHaveLength(2);
    expect(screen.getAllByText("Công ty A").length).toBeGreaterThan(0);
    expect(screen.getByText("0312345678")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not open the form while a registration condition is unmet, and points to the missing step", async () => {
    serve(profileOf("DRAFT", { ...verifiedWallet, bankLinkStatus: "BANK_UNLINKED" }));
    renderContainer();
    await userEvent.click(await screen.findByRole("tab", { name: "Đăng ký ĐVCNTT" }));
    expect(await screen.findByText(/Chưa đủ điều kiện đăng ký/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Liên kết ngân hàng" })).toHaveAttribute("href", "/bank-accounts");
    expect(screen.queryByRole("button", { name: "Gửi duyệt" })).not.toBeInTheDocument();
  });

  it("explains a KYB still under review as the reason", async () => {
    serve(profileOf("DRAFT", { ...verifiedWallet, verificationStatus: "PENDING_APPROVAL" }));
    renderContainer();
    await userEvent.click(await screen.findByRole("tab", { name: "Đăng ký ĐVCNTT" }));
    expect(await screen.findByText("Đang chờ Flexpay duyệt")).toBeInTheDocument();
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
    await pickIndustry();
    await userEvent.type(await screen.findByLabelText(/Người liên hệ/), "Nguyễn Vận Hành 1900 1755");
    await userEvent.click(screen.getByRole("button", { name: "Gửi duyệt" }));
    await waitFor(() => expect(calls).toEqual(["save", "submit"]));
    expect(body).toMatchObject({ mccCode: "5812", name: "Quán A", supportContact: "Nguyễn Vận Hành 1900 1755" });
    expect(body).not.toHaveProperty("adminPassword");
  });

  it("shows field errors and does not call the server when required values are missing", async () => {
    let called = false;
    serve(profileOf("DRAFT"));
    mswServer.use(http.put(`${base}/merchants/${merchantId}`, () => {
      called = true;
      return HttpResponse.json(profileOf("DRAFT"));
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Gửi duyệt" }));
    expect(await screen.findByText("Nhập mã MCC")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("keeps the form and shows the BE message when submit fails", async () => {
    serve(profileOf("DRAFT"));
    mswServer.use(
      http.put(`${base}/merchants/${merchantId}`, () => HttpResponse.json(profileOf("DRAFT"))),
      http.post(`${base}/merchants/${merchantId}/submit`, () =>
        HttpResponse.json({ message: "Hồ sơ chưa đủ điều kiện" }, { status: 409 })),
    );
    renderContainer();
    await pickIndustry();
    await userEvent.type(await screen.findByLabelText(/Người liên hệ/), "Nguyễn Vận Hành 1900 1755");
    await userEvent.click(screen.getByRole("button", { name: "Gửi duyệt" }));
    expect(await screen.findByText("Hồ sơ chưa đủ điều kiện")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi duyệt" })).toBeInTheDocument();
  });

  it("changes the contract hint with the per-Sub-merchant switch", async () => {
    serve(profileOf("DRAFT"));
    renderContainer();
    expect(await screen.findByText(/ký một hợp đồng ở cấp Master/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("switch", { name: /Ký hợp đồng riêng/ }));
    expect(await screen.findByText(/mỗi Sub-merchant ký hợp đồng riêng/)).toBeInTheDocument();
  });

  it("shows read-only progress while pending, with no edit action", async () => {
    serve(profileOf("PENDING_APPROVAL"));
    renderContainer();
    expect(await screen.findByText("Chờ duyệt ĐVCNTT")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Tiến trình xử lý hồ sơ" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gửi duyệt|Lưu nháp/ })).not.toBeInTheDocument();
  });

  it("shows the rejection reason above the form and lets the user resubmit", async () => {
    serve({ ...profileOf("REJECTED"), rejectedReasonDetail: "Website không hợp lệ" });
    renderContainer();
    expect(await screen.findByText("Website không hợp lệ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi duyệt" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu nháp" })).not.toBeInTheDocument();
  });

  it("shows the website as a short link that opens in a new tab", async () => {
    const url = "https://chat.halotech.io.vn/notes/cmtobcrc2000007m6gvuwrltz/cmtwe31sto00013chz9tb4mbz";
    serve({ ...profileOf("ACTIVE"), websiteUrl: url });
    renderContainer();
    const link = await screen.findByRole("link", { name: /Liên kết website/ });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText(url)).not.toBeInTheDocument();
  });

  it("never turns a non-http website value into a link", async () => {
    serve({ ...profileOf("ACTIVE"), websiteUrl: "javascript:alert(1)" });
    renderContainer();
    expect(await screen.findByText("javascript:alert(1)")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Liên kết website/ })).not.toBeInTheDocument();
  });
});
