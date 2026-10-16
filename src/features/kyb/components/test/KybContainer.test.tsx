// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
const challenge = { otpSessionId: "session-1", maskedRecipient: "ow***@example.com", expiresInSeconds: 300, canResendAfterSeconds: 60 };

function profileOf(wallet: EnterpriseWallet, status: MerchantProfile["status"] = "DRAFT"): MerchantProfile {
  return { id: merchantId, status, name: "Quán A", enterpriseWalletId: walletId, enterpriseWallet: wallet };
}

function serve(profile: MerchantProfile) {
  mswServer.use(
    http.get(`${base}/merchants/${merchantId}`, () => HttpResponse.json(profile)),
    http.get(`${base}/merchants/${merchantId}/status-history`, () => HttpResponse.json({ rows: [], total: 0 })),
    http.get(`${base}/wallets/${walletId}/tax-code-usage`, () => HttpResponse.json([])),
  );
}

function renderContainer(canManage = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <KybContainer merchantId={merchantId} canManage={canManage} />
    </QueryClientProvider>,
  );
}

const pdf = () => new File(["pdf"], "license.pdf", { type: "application/pdf" });
const png = (name: string) => new File(["img"], name, { type: "image/png" });

async function typeCode(code: string) {
  await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await userEvent.keyboard(code);
}

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
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("lays the form out on the page for a draft, with the registered email fixed", async () => {
    serve(profileOf(draftWallet));
    renderContainer();
    expect(await screen.findByRole("button", { name: "Tiếp tục: xác thực OTP" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email đăng ký/)).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps a pending dossier read-only with its review progress", async () => {
    serve(profileOf({ ...draftWallet, verificationStatus: "PENDING_APPROVAL", updatedAt: "2026-10-09T11:24:00" }));
    renderContainer();
    expect(await screen.findByText("Chờ duyệt KYB")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Tiến trình xử lý hồ sơ" })).toBeInTheDocument();
    expect(screen.getByText("0123456789")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tiếp tục|Lưu nháp|Cập nhật hồ sơ/ })).not.toBeInTheDocument();
  });

  it("shows a draft read only, with no way to change or submit it, without MANAGE_SUB_MERCHANT", async () => {
    serve(profileOf(draftWallet));
    renderContainer(false);
    expect(await screen.findByText("0123456789")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tiếp tục|Lưu nháp|Cập nhật hồ sơ/ })).not.toBeInTheDocument();
  });

  it("hides the update action on a verified dossier without MANAGE_SUB_MERCHANT", async () => {
    serve(profileOf({ ...draftWallet, verificationStatus: "VERIFIED" }, "ACTIVE"));
    renderContainer(false);
    await userEvent.click(await screen.findByRole("tab", { name: "Xác thực KYB" }));
    expect(screen.getByText("0123456789")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cập nhật hồ sơ" })).not.toBeInTheDocument();
  });

  it("shows the rejection reason above the form and no draft save", async () => {
    serve(profileOf({ ...draftWallet, verificationStatus: "REJECTED", kybRejectedReason: "Ảnh CCCD bị mờ" }));
    renderContainer();
    expect(await screen.findByText("Ảnh CCCD bị mờ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tiếp tục: xác thực OTP" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu nháp" })).not.toBeInTheDocument();
  });
});

describe("KYB flow", () => {
  let putBodies: Record<string, unknown>[];
  let submitBodies: unknown[];
  let uploads: string[];
  let challenges: number;
  let current: EnterpriseWallet;

  beforeEach(() => {
    putBodies = [];
    submitBodies = [];
    uploads = [];
    challenges = 0;
    current = draftWallet;
    mswServer.use(
      http.get(`${base}/merchants/${merchantId}`, () => HttpResponse.json(profileOf(current))),
      http.get(`${base}/merchants/${merchantId}/status-history`, () => HttpResponse.json({ rows: [], total: 0 })),
      http.get(`${base}/wallets/${walletId}/tax-code-usage`, () => HttpResponse.json([])),
      http.post(`${base}/otp-challenge`, () => {
        challenges += 1;
        return HttpResponse.json(challenge);
      }),
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
      http.post(`${base}/wallets/${walletId}/submit`, async ({ request }) => {
        submitBodies.push(await request.json());
        current = { ...current, verificationStatus: "PENDING_APPROVAL" };
        return HttpResponse.json(current);
      }),
    );
  });

  async function openForm() {
    renderContainer();
    await screen.findByRole("button", { name: "Tiếp tục: xác thực OTP" });
  }

  async function uploadAllDocuments() {
    await userEvent.upload(screen.getByLabelText(/Giấy phép ĐKKD/), pdf());
    await userEvent.upload(screen.getByLabelText(/CCCD mặt trước/), png("front.png"));
    await userEvent.upload(screen.getByLabelText(/CCCD mặt sau/), png("back.png"));
    await waitFor(() => expect(uploads).toHaveLength(3));
  }

  it("saves a draft with staging ids, without the email, the internal flag or a password", async () => {
    await openForm();
    await uploadAllDocuments();
    await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(putBodies).toHaveLength(1));
    expect(putBodies[0]).toMatchObject({
      legalName: "Công ty A",
      taxCode: "0123456789",
      businessLicenseStagingId: stagingId,
      idCardFrontStagingId: stagingId,
      idCardBackStagingId: stagingId,
    });
    for (const forbidden of ["registeredEmail", "adminPassword", "internalWallet", "otp"]) {
      expect(putBodies[0]).not.toHaveProperty(forbidden);
    }
  });

  it("blocks continuing while a required document is missing", async () => {
    await openForm();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục: xác thực OTP" }));
    expect(await screen.findAllByText("Cần tải lên tệp này")).toHaveLength(3);
    expect(putBodies).toHaveLength(0);
    expect(challenges).toBe(0);
  });

  it("shows a validation message beside the field and does not save", async () => {
    await openForm();
    await uploadAllDocuments();
    const phone = screen.getByLabelText(/SĐT nhận thông báo/);
    await userEvent.clear(phone);
    await userEvent.type(phone, "12");
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục: xác thực OTP" }));
    expect(await screen.findByText("Số điện thoại gồm 10-11 chữ số")).toBeInTheDocument();
    expect(putBodies).toHaveLength(0);
  });

  it("rejects a wrong file type beside the field without calling the server", async () => {
    await openForm();
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(screen.getByLabelText(/Giấy phép ĐKKD/), new File(["<p>"], "x.html", { type: "text/html" }));
    expect(await screen.findByText(/chỉ nhận PDF\/JPG\/PNG/)).toBeInTheDocument();
    expect(uploads).toHaveLength(0);
  });

  it("keeps the previous file when a replacement upload fails", async () => {
    await openForm();
    const input = screen.getByLabelText(/Giấy phép ĐKKD/);
    await userEvent.upload(input, pdf());
    expect(await screen.findByText("license.pdf")).toBeInTheDocument();
    mswServer.use(http.post(`${base}/documents`, () => HttpResponse.json({ message: "Máy chủ lỗi" }, { status: 500 })));
    await userEvent.upload(input, new File(["pdf2"], "moi.pdf", { type: "application/pdf" }));
    expect(await screen.findByText("Máy chủ lỗi")).toBeInTheDocument();
    expect(screen.getByText("license.pdf")).toBeInTheDocument();
  });

  it("saves, asks for the email OTP, submits with it and shows the sent state", async () => {
    await openForm();
    await uploadAllDocuments();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục: xác thực OTP" }));
    expect(await screen.findByText(/ow\*\*\*@example\.com/)).toBeInTheDocument();
    expect(putBodies).toHaveLength(1);
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận và gửi hồ sơ" }));
    expect(await screen.findByRole("heading", { name: "Đã gửi yêu cầu KYB" })).toBeInTheDocument();
    expect(submitBodies).toEqual([{ otp: { otpSessionId: "session-1", otp: "123456" } }]);
    await userEvent.click(screen.getByRole("button", { name: "Xem trạng thái duyệt" }));
    expect(await screen.findByText("Chờ duyệt KYB")).toBeInTheDocument();
  });

  it("keeps the OTP step and shows the BE message for a wrong code", async () => {
    mswServer.use(http.post(`${base}/wallets/${walletId}/submit`, () =>
      HttpResponse.json({ message: "Mã OTP không đúng" }, { status: 400 })));
    await openForm();
    await uploadAllDocuments();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục: xác thực OTP" }));
    await screen.findByText(/ow\*\*\*@example\.com/);
    await typeCode("111111");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận và gửi hồ sơ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã OTP không đúng");
    expect(screen.getByRole("textbox", { name: "Digit 1 of 6" })).toBeInTheDocument();
  });

  it("keeps the form and shows the BE message when saving fails", async () => {
    mswServer.use(http.put(`${base}/wallets/${walletId}`, () =>
      HttpResponse.json({ message: "Mã số thuế đã tồn tại" }, { status: 409 })));
    await openForm();
    await uploadAllDocuments();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục: xác thực OTP" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã số thuế đã tồn tại");
    expect(challenges).toBe(0);
  });

  it("names the other wallets that already use the tax code", async () => {
    mswServer.use(http.get(`${base}/wallets/${walletId}/tax-code-usage`, () => HttpResponse.json(["Công ty Khác"])));
    await openForm();
    expect(await screen.findByText(/đã có ở ví: Công ty Khác/)).toBeInTheDocument();
  });
});

describe("KYB of a verified dossier", () => {
  const stored = { id: stagingId, filename: "da-luu.png" };
  const verified: EnterpriseWallet = {
    ...draftWallet,
    verificationStatus: "VERIFIED",
    bankLinkStatus: "BANK_LINKED",
    businessLicense: stored,
    idCardFront: stored,
    idCardBack: stored,
  };
  let putBodies: Record<string, unknown>[];
  let challenges: number;

  beforeEach(() => {
    putBodies = [];
    challenges = 0;
    serve(profileOf(verified));
    mswServer.use(
      http.post(`${base}/otp-challenge`, () => {
        challenges += 1;
        return HttpResponse.json(challenge);
      }),
      http.put(`${base}/wallets/${walletId}`, async ({ request }) => {
        putBodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json(verified);
      }),
    );
  });

  async function openEdit() {
    renderContainer();
    await userEvent.click(await screen.findByRole("tab", { name: "Xác thực KYB" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cập nhật hồ sơ" }));
  }

  it("warns beside an identity field only once the user changes it", async () => {
    await openEdit();
    expect(screen.queryByText(/Chờ duyệt KYB\./)).not.toBeInTheDocument();
    const name = await screen.findByLabelText(/Tên pháp nhân/);
    await userEvent.type(name, " Mới");
    expect(await screen.findByText("Đổi tên pháp nhân sẽ đưa hồ sơ về Chờ duyệt KYB.")).toBeInTheDocument();
    await userEvent.clear(name);
    await userEvent.type(name, "Công ty A");
    await waitFor(() => expect(screen.queryByText("Đổi tên pháp nhân sẽ đưa hồ sơ về Chờ duyệt KYB.")).not.toBeInTheDocument());
  });

  it("sends an identity change back to review behind the OTP, carried on the save", async () => {
    await openEdit();
    await userEvent.type(await screen.findByLabelText(/Tên pháp nhân/), " Mới");
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục: xác thực OTP và gửi lại" }));
    await screen.findByText(/ow\*\*\*@example\.com/);
    expect(putBodies).toHaveLength(0);
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận và gửi lại hồ sơ" }));
    await waitFor(() => expect(putBodies).toHaveLength(1));
    expect(putBodies[0]).toMatchObject({ legalName: "Công ty A Mới", otp: { otpSessionId: "session-1", otp: "123456" } });
  });

  it("saves a change that needs no review straight away, with no OTP", async () => {
    await openEdit();
    const address = await screen.findByLabelText(/Địa chỉ trụ sở/);
    await userEvent.clear(address);
    await userEvent.type(address, "Hải Phòng");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(putBodies).toHaveLength(1));
    expect(putBodies[0]).toMatchObject({ headOfficeAddress: "Hải Phòng" });
    expect(putBodies[0]).not.toHaveProperty("otp");
    expect(challenges).toBe(0);
  });
});
