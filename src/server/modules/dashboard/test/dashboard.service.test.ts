import { beforeEach, describe, expect, it, vi } from "vitest";

import { fail, ok } from "@/lib/http/result";

vi.mock("server-only", () => ({}));
const listOrders = vi.fn();
const listWithdrawals = vi.fn();
const listTerminals = vi.fn();
vi.mock("@/server/modules/orders/order.service", () => ({ listOrders }));
vi.mock("@/server/modules/withdrawals/withdrawal.service", () => ({ listWithdrawals }));
vi.mock("@/server/modules/terminals/terminal.service", () => ({ listTerminals }));

const { loadOrderSnapshot, loadTerminalSnapshot, loadWithdrawalSnapshot } = await import("../dashboard.service");

const NOW = new Date("2026-10-12T07:00:00Z");
const order = (id: number, status: string, createdAt: string, amount = 1000) => ({ id: String(id), status, createdAt, amount, orderCode: `O${id}` });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadOrderSnapshot", () => {
  it("asks for the 7 day window in two pages and for the three counts", async () => {
    listOrders.mockResolvedValue(ok({ rows: [], total: 0 }));
    await loadOrderSnapshot(NOW);
    const filters = listOrders.mock.calls.map(([filter]) => filter);
    expect(filters).toContainEqual({ page: 1, pageSize: 100, createdFrom: "2026-10-06", createdTo: "2026-10-12" });
    expect(filters).toContainEqual({ page: 2, pageSize: 100, createdFrom: "2026-10-06", createdTo: "2026-10-12" });
    expect(filters).toContainEqual({ page: 1, pageSize: 1, createdFrom: "2026-10-12", createdTo: "2026-10-12" });
    expect(filters).toContainEqual({ page: 1, pageSize: 1, createdFrom: "2026-10-11", createdTo: "2026-10-11" });
    expect(filters).toContainEqual({ page: 1, pageSize: 1, status: "ACTIVE" });
  });

  it("builds the week, the counts and the five newest orders", async () => {
    const rows = [1, 2, 3, 4, 5, 6].map((n) => order(n, "SUCCESS", "2026-10-12T03:00:00Z"));
    listOrders.mockImplementation(async (filter) => {
      if (filter.pageSize === 100 && filter.page === 1) return ok({ rows, total: 6 });
      if (filter.pageSize === 100) return ok({ rows: [], total: 6 });
      if (filter.status === "ACTIVE") return ok({ rows: [], total: 4 });
      return ok({ rows: [], total: filter.createdFrom === "2026-10-12" ? 6 : 2 });
    });
    const result = await loadOrderSnapshot(NOW);
    expect(result.success && result.data).toMatchObject({ today: 6, yesterday: 2, waiting: 4, truncated: false });
    expect(result.success && result.data.recent).toHaveLength(5);
    expect(result.success && result.data.week.revenue).toBe(6000);
  });

  it("flags a week with more orders than it could read", async () => {
    listOrders.mockResolvedValue(ok({ rows: [], total: 250 }));
    const result = await loadOrderSnapshot(NOW);
    expect(result.success && result.data.truncated).toBe(true);
  });

  it("fails when any request fails", async () => {
    listOrders.mockImplementation(async (filter) => (filter.status ? fail({ status: 500, code: "X", message: "boom" }) : ok({ rows: [], total: 0 })));
    expect((await loadOrderSnapshot(NOW)).success).toBe(false);
  });
});

describe("loadWithdrawalSnapshot", () => {
  it("returns the newest five and the pending count", async () => {
    listWithdrawals.mockImplementation(async (filter) =>
      filter.statusGroup === "PENDING" ? ok({ rows: [], total: 3 }) : ok({ rows: [{ id: "w1" }], total: 40 }),
    );
    const result = await loadWithdrawalSnapshot();
    expect(listWithdrawals).toHaveBeenCalledWith({ page: 1, pageSize: 5 });
    expect(result.success && result.data).toEqual({ recent: [{ id: "w1" }], pending: 3 });
  });
});

describe("loadTerminalSnapshot", () => {
  it("counts active and all terminals", async () => {
    listTerminals.mockImplementation(async (filter) => ok({ rows: [], total: filter.status === "ACTIVE" ? 8 : 10 }));
    const result = await loadTerminalSnapshot();
    expect(result.success && result.data).toEqual({ active: 8, total: 10 });
  });
});
