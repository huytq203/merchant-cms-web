// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { KybContainer } from "./KybContainer";
import type { EnterpriseWallet, MerchantProfile } from "../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const merchantId = "11111111-1111-4111-8111-111111111111";
const walletId = "22222222-2222-4222-8222-222222222222";
const stagingId = "33333333-3333-4333-8333-333333333333";
const base = "/api/v1/admin/kyb";

const draftWallet: EnterpriseWallet = {
  id: walletId,
  registeredEmail: "owner@example.com",
  verificationStatus: "DRAFT",
  bankLinkStatus: "BANK_UNLINKED",
  businessType: "ENTERPRISE",
  legalName: "Công ty A",
  taxCode: "0123456789",
  headOfficeAddress: "Hà Nội",
  legalRepresentativeName: "Nguyễn A",
  legalRepresentativeIdNumber: "P1234567",
  managerName: "Nguyễn A",
  managerTitle: "Giám đốc",
  managerIdNumber: "012345678901",
  managerIdExpiryDate: "2099-01-01",
  otpPhone: "0912345678",
  internalWallet: false,
};

function profileOf(wallet: EnterpriseWallet, status: MerchantProfile["status"] = "DRAFT"): MerchantProfile {
  return { id: merchantId, status, name: "Quán A", enterpriseWalletId: walletId, enterpriseWallet: wallet };
}

function serve(profile: MerchantProfile) {
  mswServer.use(
    http.get(`${base}/merchants/${merchantId}`, () => HttpResponse.json(profile)),
    http.get(`${base}/merchants/${merchantId}/status-history`, () => HttpResponse.json({ rows: [], total: 0 })),
  );
}

function renderContainer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <KybContainer merchantId={merchantId} />
    </QueryClientProvider>,
  );
}

const pdf = () => new File(["pdf"], "license.pdf", { type: "application/pdf" });
const png = (name: string) => new File(["img"], name, { type: "image/png" });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("KYB container states", () => {
  it("shows loading, then an error with retry", async () => {
    mswServer.use(http.get(`${base}/merchants/${merchantId}`, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole("status", { name: "Đang tải hồ sơ" })).toBeInTheDocument();
    loading.unmount();
    mswServer.use(
      http.get(`${base}/merchants/${merchantId}`, () => HttpResponse.json({ message: "Không tải được" }, { status: 502 })),
    );
    renderContainer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("shows an empty state when the merchant has no wallet", async () => {
    serve({ id: merchantId, status: "DRAFT", enterpriseWallet: null });
    renderContainer();
    expect(await screen.findByText(/chưa gắn với ví doanh nghiệp/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Khai báo hồ sơ" })).not.toBeInTheDocument();
  });

  it("shows the data state with the masked tax code", async () => {
    serve(profileOf(draftWallet));
    renderContainer();
    expect(await screen.findByRole("button", { name: "Khai báo hồ sơ" })).toBeInTheDocument();
    expect(screen.getByText("Công ty A")).toBeInTheDocument();
    expect(screen.queryByText("0123456789")).not.toBeInTheDocument();
    expect(screen.getByText("••••••6789")).toBeInTheDocument();
  });

  it("keeps a pending dossier read-only", async () => {
    serve(profileOf({ ...draftWallet, verificationStatus: "PENDING_APPROVAL" }));
    renderContainer();
    expect(await screen.findByText(/Đang chờ duyệt/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Khai báo hồ sơ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chỉnh sửa và gửi lại" })).not.toBeInTheDocument();
  });

  it("shows the rejection reason and offers to edit and resubmit", async () => {
    serve(profileOf({ ...draftWallet, verificationStatus: "REJECTED", kybRejectedReason: "Ảnh CCCD bị mờ" }));
    renderContainer();
    expect(await screen.findByText("Ảnh CCCD bị mờ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chỉnh sửa và gửi lại" })).toBeInTheDocument();
  });
});

describe("KYB wizard", () => {
  let putBodies: Record<string, unknown>[];
  let submitted: boolean;
  let uploads: string[];
  let current: EnterpriseWallet;

  beforeEach(() => {
    putBodies = [];
    submitted = false;
    uploads = [];
    current = draftWallet;
    mswServer.use(
      http.get(`${base}/merchants/${merchantId}`, () => HttpResponse.json(profileOf(current))),
      http.get(`${base}/merchants/${merchantId}/status-history`, () => HttpResponse.json({ rows: [], total: 0 })),
      http.post(`${base}/documents`, async ({ request }) => {
        // jsdom's FormData cannot be re-parsed by request.formData(), so read the raw multipart text.
        const text = await request.text();
        uploads.push(/name="documentType"\r\n\r\n([A-Z_]+)/.exec(text)?.[1] ?? "");
        return HttpResponse.json({ stagingId }, { status: 201 });
      }),
      http.put(`${base}/wallets/${walletId}`, async ({ request }) => {
        putBodies.push(await request.json() as Record<string, unknown>);
        const stored = { id: stagingId, filename: "da-luu.png" };
        current = { ...current, businessLicense: stored, idCardFront: stored, idCardBack: stored };
        return HttpResponse.json(current);
      }),
      http.post(`${base}/wallets/${walletId}/submit`, () => {
        submitted = true;
        current = { ...current, verificationStatus: "PENDING_APPROVAL" };
        return HttpResponse.json(current);
      }),
    );
  });

  async function openWizard() {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Khai báo hồ sơ" }));
    return screen.findByRole("dialog");
  }

  async function uploadAllDocuments() {
    await userEvent.upload(screen.getByLabelText(/Giấy phép ĐKKD/), pdf());
    await userEvent.upload(screen.getByLabelText(/CCCD mặt trước/), png("front.png"));
    await userEvent.upload(screen.getByLabelText(/CCCD mặt sau/), png("back.png"));
    await waitFor(() => expect(uploads).toHaveLength(3));
  }

  it("saves a draft with staging ids, without the email and with the internal flag", async () => {
    await openWizard();
    await uploadAllDocuments();
    await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(putBodies).toHaveLength(1));
    expect(putBodies[0]).toMatchObject({
      legalName: "Công ty A",
      taxCode: "0123456789",
      internalWallet: false,
      businessLicenseStagingId: stagingId,
      idCardFrontStagingId: stagingId,
      idCardBackStagingId: stagingId,
    });
    expect(putBodies[0]).not.toHaveProperty("registeredEmail");
    expect(putBodies[0]).not.toHaveProperty("adminPassword");
  });

  it("blocks continuing while a required document is missing", async () => {
    await openWizard();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findAllByText("Cần tải lên tệp này")).toHaveLength(3);
    expect(putBodies).toHaveLength(0);
  });

  it("shows a validation message beside the field and does not save", async () => {
    await openWizard();
    await uploadAllDocuments();
    const phone = screen.getByLabelText(/Số điện thoại nhận OTP/);
    await userEvent.clear(phone);
    await userEvent.type(phone, "12");
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText("Số điện thoại gồm 10-11 chữ số")).toBeInTheDocument();
    expect(putBodies).toHaveLength(0);
  });

  it("rejects a wrong file type beside the field without calling the server", async () => {
    await openWizard();
    const user = userEvent.setup({ applyAccept: false });
    const html = new File(["<p>"], "x.html", { type: "text/html" });
    await user.upload(screen.getByLabelText(/Giấy phép ĐKKD/), html);
    expect(await screen.findByText(/chỉ nhận PDF\/JPG\/PNG/)).toBeInTheDocument();
    expect(uploads).toHaveLength(0);
  });

  it("keeps the previous file when a replacement upload fails", async () => {
    await openWizard();
    const input = screen.getByLabelText(/Giấy phép ĐKKD/);
    await userEvent.upload(input, pdf());
    expect(await screen.findByText("license.pdf")).toBeInTheDocument();
    mswServer.use(http.post(`${base}/documents`, () => HttpResponse.json({ message: "Máy chủ lỗi" }, { status: 500 })));
    await userEvent.upload(input, new File(["pdf2"], "moi.pdf", { type: "application/pdf" }));
    expect(await screen.findByText("Máy chủ lỗi")).toBeInTheDocument();
    expect(screen.getByText("license.pdf")).toBeInTheDocument();
    expect(screen.queryByText("moi.pdf")).not.toBeInTheDocument();
  });

  it("goes through review and submits, then shows the success state", async () => {
    await openWizard();
    await uploadAllDocuments();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    const send = await screen.findByRole("button", { name: "Gửi yêu cầu xác thực KYB" });
    expect(screen.queryByText("012345678901")).not.toBeInTheDocument();
    await userEvent.click(send);
    expect(await screen.findByRole("link", { name: "Về Dashboard" })).toBeInTheDocument();
    expect(submitted).toBe(true);
  });

  it("keeps the dialog and shows the BE message when saving fails", async () => {
    mswServer.use(http.put(`${base}/wallets/${walletId}`, () =>
      HttpResponse.json({ message: "Mã số thuế đã tồn tại" }, { status: 409 })));
    await openWizard();
    await uploadAllDocuments();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã số thuế đã tồn tại");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not offer a draft save for a rejected dossier", async () => {
    current = { ...draftWallet, verificationStatus: "REJECTED", kybRejectedReason: "Thiếu giấy tờ" };
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Chỉnh sửa và gửi lại" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu nháp" })).not.toBeInTheDocument();
  });
});
