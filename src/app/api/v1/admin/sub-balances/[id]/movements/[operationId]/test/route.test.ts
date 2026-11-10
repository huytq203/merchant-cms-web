import { beforeEach, describe, expect, it, vi } from "vitest";
import { OP_ORDER, SUB_ID, orderDetail } from "@/features/sub-balances/test/movement-fixtures";

const { getServerSession, getSubBalanceMovement } = vi.hoisted(() => ({ getServerSession: vi.fn(), getSubBalanceMovement: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-balances/sub-balance.service", () => ({ getSubBalanceMovement }));
import { GET } from "../route";

const get = (id = SUB_ID, operationId = OP_ORDER) =>
  GET(new Request("http://localhost/x"), { params: Promise.resolve({ id, operationId }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["VIEW_BALANCE"], merchantIds: ["m"] });
  getSubBalanceMovement.mockResolvedValue({ success: true, data: orderDetail });
});

describe("sub balance movement detail route", () => {
  it("needs a session and VIEW_BALANCE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    getServerSession.mockResolvedValue({ permissions: [], merchantIds: ["m"] });
    expect((await get()).status).toBe(403);
    expect(getSubBalanceMovement).not.toHaveBeenCalled();
  });

  it("answers 404 for a non-UUID id or operation id", async () => {
    expect((await get("nope")).status).toBe(404);
    expect((await get(SUB_ID, "nope")).status).toBe(404);
    expect(getSubBalanceMovement).not.toHaveBeenCalled();
  });

  it("returns the detail", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect((await response.json()).label).toBe(orderDetail.label);
    expect(getSubBalanceMovement).toHaveBeenCalledWith(SUB_ID, OP_ORDER);
  });

  it("keeps the BE 404 for an operation of another Sub", async () => {
    getSubBalanceMovement.mockResolvedValue({ success: false, error: { status: 404, code: "X", message: "x" } });
    expect((await get()).status).toBe(404);
  });
});
