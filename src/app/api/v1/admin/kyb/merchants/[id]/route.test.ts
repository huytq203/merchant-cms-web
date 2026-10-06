import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getMerchant, updateMerchant, submitMerchant } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMerchant: vi.fn(),
  updateMerchant: vi.fn(),
  submitMerchant: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ getMerchant, updateMerchant, submitMerchant }));

import { GET, PUT } from "./route";
import { POST as SUBMIT } from "./submit/route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const otherId = "99999999-9999-4999-8999-999999999999";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const url = `http://localhost/api/v1/admin/kyb/merchants/${merchantId}`;
const values = {
  mccCode: "5812",
  name: "Quán A",
  websiteUrl: "",
  supportContact: "0912345678",
  productDescription: "",
  contractSignedWithSub: false,
};

function put(body: unknown) {
  return new Request(url, { method: "PUT", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId] });
  getMerchant.mockResolvedValue({ success: true, data: { id: merchantId, status: "DRAFT" } });
  updateMerchant.mockResolvedValue({ success: true, data: { id: merchantId, status: "DRAFT" } });
  submitMerchant.mockResolvedValue({ success: true, data: { id: merchantId, status: "PENDING_APPROVAL" } });
});

describe("KYB merchant routes", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(new Request(url), context(merchantId))).status).toBe(401);
    expect(getMerchant).not.toHaveBeenCalled();
  });

  it("answers 404 for a malformed id without calling the BE", async () => {
    expect((await GET(new Request(url), context("..%2Fsecret"))).status).toBe(404);
    expect(getMerchant).not.toHaveBeenCalled();
  });

  it("answers 404 for a merchant outside the session scope", async () => {
    expect((await GET(new Request(url), context(otherId))).status).toBe(404);
    expect((await PUT(put(values), context(otherId))).status).toBe(404);
    expect((await SUBMIT(new Request(url, { method: "POST" }), context(otherId))).status).toBe(404);
    expect(getMerchant).not.toHaveBeenCalled();
    expect(updateMerchant).not.toHaveBeenCalled();
    expect(submitMerchant).not.toHaveBeenCalled();
  });

  it("returns the merchant profile", async () => {
    const response = await GET(new Request(url), context(merchantId));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: merchantId });
  });

  it("rejects an invalid update body before calling the BE", async () => {
    expect((await PUT(put({ ...values, mccCode: "" }), context(merchantId))).status).toBe(400);
    expect(updateMerchant).not.toHaveBeenCalled();
  });

  it("forwards values and staging ids separately on update", async () => {
    const logoStagingId = "22222222-2222-4222-8222-222222222222";
    const response = await PUT(put({ ...values, logoStagingId }), context(merchantId));
    expect(response.status).toBe(200);
    expect(updateMerchant).toHaveBeenCalledWith(
      merchantId,
      values,
      { logoStagingId, productImageStagingIds: undefined, contractStagingId: undefined },
    );
  });

  it("submits an owned merchant and keeps BE conflicts", async () => {
    const request = new Request(url, { method: "POST" });
    expect((await SUBMIT(request, context(merchantId))).status).toBe(200);
    submitMerchant.mockResolvedValue({
      success: false,
      error: { status: 409, code: "CONFLICT", message: "Hồ sơ đang chờ duyệt" },
    });
    expect((await SUBMIT(request, context(merchantId))).status).toBe(409);
  });
});
