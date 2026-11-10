import { beforeEach, describe, expect, it, vi } from "vitest";
import { pendingId, pendingRefund, subId } from "@/features/revenue-refunds/test/fixtures";

const { getServerSession, getRevenueRefundSummary, exportRevenueRefunds, cancelRevenueRefund } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getRevenueRefundSummary: vi.fn(),
  exportRevenueRefunds: vi.fn(),
  cancelRevenueRefund: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/revenue-refunds/revenue-refund.service", () => ({ getRevenueRefundSummary, exportRevenueRefunds, cancelRevenueRefund }));
import { POST as cancel } from "../[id]/cancel/route";
import { GET as exportCsv } from "../export/route";
import { GET as summary } from "../summary/route";

const session = { permissions: ["VIEW_REFUND"], merchantIds: ["m"], subMerchantIds: [subId] };
const url = "http://localhost/api/v1/admin/revenue-refunds";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
});

describe("summary route", () => {
  it("needs VIEW_REFUND, validates the filter and forwards it", async () => {
    getRevenueRefundSummary.mockResolvedValue({ success: true, data: { total: 1, pending: 1, processing: 0, succeeded: 0, failed: 0, succeededAmount: 0 } });
    const response = await summary(new Request(`${url}/summary?q=DH26&from=2026-11-04&to=2026-11-10`));
    expect(response.status).toBe(200);
    expect(getRevenueRefundSummary).toHaveBeenCalledWith({ q: "DH26", from: "2026-11-04", to: "2026-11-10" });
    expect((await summary(new Request(`${url}/summary?from=hom-qua`))).status).toBe(400);
    getServerSession.mockResolvedValue({ ...session, permissions: ["CREATE_REFUND"] });
    expect((await summary(new Request(`${url}/summary`))).status).toBe(403);
  });
});

describe("export route", () => {
  it("passes the BE CSV through byte for byte with its file name", async () => {
    const body = new TextEncoder().encode("﻿Mã hoàn tiền\r\n").buffer;
    exportRevenueRefunds.mockResolvedValue({ success: true, data: { body, contentType: "text/csv;charset=UTF-8", contentDisposition: "attachment; filename=\"hoan-tien_1.csv\"" } });
    const response = await exportCsv(new Request(`${url}/export?statuses=SUCCEEDED`));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("hoan-tien_1.csv");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(body));
    expect(exportRevenueRefunds).toHaveBeenCalledWith({ statuses: "SUCCEEDED" });
  });

  it("returns the BE refusal (more rows than the cap) as a Vietnamese message", async () => {
    exportRevenueRefunds.mockResolvedValue({ success: false, error: { status: 400, code: "VALIDATION_ERROR", message: "Có hơn 20000 yêu cầu hoàn tiền khớp bộ lọc, vui lòng thu hẹp khoảng thời gian rồi xuất lại" } });
    const response = await exportCsv(new Request(`${url}/export`));
    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("thu hẹp");
  });
});

describe("cancel route", () => {
  it("accepts a creator or an approver and refuses a viewer", async () => {
    cancelRevenueRefund.mockResolvedValue({ success: true, data: { ...pendingRefund, status: "CANCELLED" } });
    const call = () => cancel(new Request(`${url}/${pendingId}/cancel`, { method: "POST" }), { params: Promise.resolve({ id: pendingId }) });
    expect((await call()).status).toBe(403);
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_REFUND", "CREATE_REFUND"] });
    expect((await call()).status).toBe(200);
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_REFUND", "APPROVE_REFUND"] });
    expect((await call()).status).toBe(200);
    expect(cancelRevenueRefund).toHaveBeenCalledWith(pendingId);
  });

  it("rejects a malformed id before calling the BE", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["CREATE_REFUND"] });
    const response = await cancel(new Request(`${url}/x/cancel`, { method: "POST" }), { params: Promise.resolve({ id: "../x" }) });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(cancelRevenueRefund).not.toHaveBeenCalled();
  });
});
