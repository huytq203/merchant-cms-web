import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listSubMerchantChoiceRows } = vi.hoisted(() => ({ getServerSession: vi.fn(), listSubMerchantChoiceRows: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-merchants/sub-merchant.service", () => ({ listSubMerchantChoiceRows }));
import { GET } from "../route";

const row = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", code: "S01", name: "Cửa hàng A", status: "ACTIVE", merchantId: null, isDefault: false };
const session = (permissions: string[], merchantIds: string[] = []) => ({ userId: "u", merchantIds, subMerchantIds: [row.id], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  listSubMerchantChoiceRows.mockResolvedValue({ success: true, data: [row] });
});

describe("GET /api/v1/admin/sub-merchants/choices", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(listSubMerchantChoiceRows).not.toHaveBeenCalled();
  });

  it("refuses a session with none of the Sub-picker permissions", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_AUDIT_LOG"]));
    expect((await GET()).status).toBe(403);
    expect(listSubMerchantChoiceRows).not.toHaveBeenCalled();
  });

  it.each(["VIEW_TERMINAL", "VIEW_ORDER", "MANAGE_USER", "VIEW_BANK_ACCOUNT", "VIEW_DISPUTE", "MANAGE_SUB_MERCHANT"])(
    "names the Subs for a %s session even without a Master of its own",
    async (permission) => {
      getServerSession.mockResolvedValue(session([permission]));
      const response = await GET();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([row]);
    },
  );

  it("passes a BE failure through with a Vietnamese message", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_ORDER"]));
    listSubMerchantChoiceRows.mockResolvedValue({ success: false, error: { status: 500, code: "INTERNAL", message: "boom" } });
    const response = await GET();
    // toDomainHttpStatus đổi lỗi 5xx của BE thành 502 (lỗi phía sau cổng).
    expect(response.status).toBe(502);
    expect((await response.json()).message).toBeTruthy();
  });
});
