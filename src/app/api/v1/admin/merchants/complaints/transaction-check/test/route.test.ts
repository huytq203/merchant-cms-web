import { beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({ checkTransaction: vi.fn() }));
const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/complaints/complaint.service", () => service);

import { GET } from "../route";

const url = (query = "") => new Request(`http://localhost/api/v1/admin/merchants/complaints/transaction-check${query}`);
const session = (permissions: string[]) => ({ merchantIds: [], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["CREATE_DISPUTE"]));
});

describe("transaction-check route", () => {
  it("answers 401 without a session and 403 without CREATE_DISPUTE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(url("?transactionCode=FM1"))).status).toBe(401);
    getServerSession.mockResolvedValue(session(["VIEW_DISPUTE"]));
    expect((await GET(url("?transactionCode=FM1"))).status).toBe(403);
    expect(service.checkTransaction).not.toHaveBeenCalled();
  });

  it("rejects a missing or blank code with the Vietnamese sentence", async () => {
    for (const query of ["", "?transactionCode=", "?transactionCode=%20%20"]) {
      const response = await GET(url(query));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ message: "Vui lòng nhập mã giao dịch hoặc mã đơn hàng" });
    }
    expect(service.checkTransaction).not.toHaveBeenCalled();
  });

  it("passes the trimmed code to the BE and returns the order", async () => {
    const card = { transactionId: "t1", transactionCode: "FM1", amount: 1000, status: "SUCCESS" };
    service.checkTransaction.mockResolvedValue({ success: true, data: card });
    const response = await GET(url("?transactionCode=%20FM1%20"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(card);
    expect(service.checkTransaction).toHaveBeenCalledWith("FM1");
  });
});
