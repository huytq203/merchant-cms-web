import { beforeEach, describe, expect, it, vi } from "vitest";
import { detailFixture, itemId } from "@/features/settlement-items/test/fixtures";

const { getServerSession, getSettlementItem } = vi.hoisted(() => ({ getServerSession: vi.fn(), getSettlementItem: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/settlement-items/settlement-item.service", () => ({ getSettlementItem }));
import { GET } from "../route";

const call = (id: string) => GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["VIEW_BALANCE"], merchantIds: ["m"], subMerchantIds: [] });
  getSettlementItem.mockResolvedValue({ success: true, data: detailFixture });
});

describe("settlement item detail route", () => {
  it("denies access without VIEW_BALANCE", async () => {
    getServerSession.mockResolvedValue({ permissions: [], merchantIds: ["m"], subMerchantIds: [] });
    expect((await call(itemId)).status).toBe(403);
    expect(getSettlementItem).not.toHaveBeenCalled();
  });

  it("answers 404 for a malformed id without calling the BE", async () => {
    expect((await call("..%2f")).status).toBe(404);
    expect(getSettlementItem).not.toHaveBeenCalled();
  });

  it("returns the item", async () => {
    const response = await call(itemId);
    expect(response.status).toBe(200);
    expect(getSettlementItem).toHaveBeenCalledWith(itemId);
  });
});
