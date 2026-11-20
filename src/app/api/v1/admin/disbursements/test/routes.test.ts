import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, createDisbursement, uploadDisbursementBatch } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  createDisbursement: vi.fn(),
  uploadDisbursementBatch: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/disbursements/disbursement.service", () => ({ createDisbursement, uploadDisbursementBatch }));
import { POST as createRoute } from "../route";
import { POST as validateRoute } from "../batches/validate/route";

const SUB = "11111111-1111-4111-8111-111111111111";
const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["CREATE_DISBURSEMENT", "VIEW_DISBURSEMENT"] };
const createBody = {
  subId: SUB,
  merchantRequestCode: "P1",
  amount: 1_000_000,
  bankCode: "VCB",
  accountNumber: "0123456789",
  nameMismatchAccepted: false,
  sensitiveOtp: { otpSessionId: "s", otp: "123456" },
};
const post = (body: unknown) => new Request("http://localhost/api/v1/admin/disbursements", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
});

describe("POST /disbursements (create)", () => {
  it("is refused without CREATE_DISBURSEMENT and never reaches BE", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_DISBURSEMENT"] });
    expect((await createRoute(post(createBody))).status).toBe(403);
    expect(createDisbursement).not.toHaveBeenCalled();
  });

  it("maps a BE timeout to 503 6323 instead of a generic 502 (so the user keeps the request code)", async () => {
    createDisbursement.mockResolvedValue({ success: false, error: { status: 0, code: "TIMEOUT", message: "Hệ thống phản hồi quá lâu" } });
    const response = await createRoute(post(createBody));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("6323");
  });

  it("returns 201 for a new order and 200 for a replayed one", async () => {
    createDisbursement.mockResolvedValueOnce({ success: true, data: { replayed: false } });
    expect((await createRoute(post(createBody))).status).toBe(201);
    createDisbursement.mockResolvedValueOnce({ success: true, data: { replayed: true } });
    expect((await createRoute(post(createBody))).status).toBe(200);
  });

  it("refuses a Sub that the session is not assigned to before calling BE", async () => {
    getServerSession.mockResolvedValue({ ...session, subMerchantIds: ["other"] });
    expect((await createRoute(post(createBody))).status).toBe(403);
    expect(createDisbursement).not.toHaveBeenCalled();
  });

  it("rejects a malformed body with 400", async () => {
    expect((await createRoute(post({ ...createBody, amount: -5 }))).status).toBe(400);
    expect(createDisbursement).not.toHaveBeenCalled();
  });
});

describe("POST /disbursements/batches/validate", () => {
  const upload = (file: File | string | null, subId: string | null = SUB) => {
    const form = new FormData();
    if (subId) form.set("subId", subId);
    if (file !== null) form.set("file", file);
    return new Request("http://localhost/api/v1/admin/disbursements/batches/validate", { method: "POST", body: form });
  };

  it("rejects a non-CSV file and an empty file before BE", async () => {
    expect((await validateRoute(upload(new File(["a"], "lo.xlsx")))).status).toBe(400);
    expect((await validateRoute(upload(new File([], "lo.csv")))).status).toBe(400);
    expect((await validateRoute(upload("not-a-file"))).status).toBe(400);
    expect(uploadDisbursementBatch).not.toHaveBeenCalled();
  });

  it("rejects a file over 2MB before BE", async () => {
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "lo.csv");
    expect((await validateRoute(upload(big))).status).toBe(400);
    expect(uploadDisbursementBatch).not.toHaveBeenCalled();
  });

  it("requires a valid Sub id and CREATE_DISBURSEMENT", async () => {
    expect((await validateRoute(upload(new File(["a"], "lo.csv"), "not-a-uuid"))).status).toBe(400);
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_DISBURSEMENT"] });
    expect((await validateRoute(upload(new File(["a"], "lo.csv")))).status).toBe(403);
  });

  it("forwards a valid CSV for the Sub to BE", async () => {
    uploadDisbursementBatch.mockResolvedValue({ success: true, data: { batchId: "b" } });
    const response = await validateRoute(upload(new File(["a,b"], "lo.csv")));
    expect(response.status).toBe(200);
    expect(uploadDisbursementBatch).toHaveBeenCalledWith(SUB, expect.any(File));
  });
});
