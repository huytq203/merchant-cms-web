import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listComplaints } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listComplaints: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/complaints/complaint.service", () => ({ listComplaints }));
import { GET } from "../route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const request = (query = "") => new Request(`http://localhost/api/v1/admin/merchants/complaints${query}`);
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_DISPUTE"]));
  listComplaints.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
});

describe("complaints route", () => {
  it("answers 401 without a session and 403 without VIEW_DISPUTE, never calling the service", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    getServerSession.mockResolvedValue(session(["VIEW_REFUND"]));
    expect((await GET(request())).status).toBe(403);
    expect(listComplaints).not.toHaveBeenCalled();
  });

  it("rejects an oversized page, an unknown source and a reversed time range", async () => {
    expect((await GET(request("?pageSize=101"))).status).toBe(400);
    expect((await GET(request("?source=bank"))).status).toBe(400);
    const reversed = "?createdFromDate=2026-10-05T00:00:00Z&createdToDate=2026-10-01T00:00:00Z";
    expect((await GET(request(reversed))).status).toBe(400);
    expect(listComplaints).not.toHaveBeenCalled();
  });

  it("passes the filter and the session merchant to the service", async () => {
    const response = await GET(request("?page=2&pageSize=20&status=pending&source=gateway"));
    expect(response.status).toBe(200);
    expect(listComplaints).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 20, status: "pending", source: "gateway", merchantId }),
    );
  });

  it("keeps 501 for an unsupported module and turns a BE 401 into 403", async () => {
    listComplaints.mockResolvedValue({
      success: false,
      error: { status: 501, code: "NOT_IMPLEMENTED", message: "Chức năng chưa được hỗ trợ" },
    });
    expect((await GET(request())).status).toBe(501);
    listComplaints.mockResolvedValue({ success: false, error: { status: 401, code: "UNAUTHORIZED", message: "x" } });
    expect((await GET(request())).status).toBe(403);
    listComplaints.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "x" } });
    expect((await GET(request())).status).toBe(502);
  });
});
