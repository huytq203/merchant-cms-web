import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, uploadDocument } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ uploadDocument, getMerchant: vi.fn() }));

import { POST } from "./route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const stagingId = "22222222-2222-4222-8222-222222222222";

function upload(file: File | null, documentType = "BUSINESS_LICENSE") {
  const body = new FormData();
  body.set("documentType", documentType);
  if (file) body.set("file", file);
  return new Request("http://localhost/api/v1/admin/kyb/documents", { method: "POST", body });
}

const pdf = () => new File(["pdf"], "license.pdf", { type: "application/pdf" });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId] });
  uploadDocument.mockResolvedValue({ success: true, data: { stagingId } });
});

describe("KYB document upload route", () => {
  it("returns 401 without a session and does not forward", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await POST(upload(pdf()))).status).toBe(401);
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("returns 403 when the session has no merchant scope", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [] });
    expect((await POST(upload(pdf()))).status).toBe(403);
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("rejects an unsupported content type before forwarding", async () => {
    const html = new File(["<p>"], "x.html", { type: "text/html" });
    expect((await POST(upload(html))).status).toBe(400);
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("rejects a file above the document limit before forwarding", async () => {
    const big = new File([new Uint8Array(3 * 1024 * 1024)], "logo.png", { type: "image/png" });
    expect((await POST(upload(big, "MERCHANT_LOGO"))).status).toBe(400);
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("rejects an unknown document type and a missing file", async () => {
    expect((await POST(upload(pdf(), "PASSPORT"))).status).toBe(400);
    expect((await POST(upload(null))).status).toBe(400);
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("forwards a valid file and returns the staging id", async () => {
    const response = await POST(upload(pdf()));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ stagingId });
    expect(uploadDocument).toHaveBeenCalledWith(expect.any(File), "BUSINESS_LICENSE");
  });

  it("keeps the BE status for a failed upload", async () => {
    uploadDocument.mockResolvedValue({
      success: false,
      error: { status: 422, code: "BAD", message: "Tệp không hợp lệ" },
    });
    expect((await POST(upload(pdf()))).status).toBe(422);
  });
});
