import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { BE_COMPLAINT, BE_COMPLAINT_ROW } from "@/features/complaints/test/complaint.fixtures";
import {
  checkTransaction,
  createComplaint,
  exportComplaints,
  getAttachmentLink,
  getComplaint,
  listComplaints,
  rejectComplaint,
  replyComplaint,
  uploadAttachment,
} from "../complaint.service";

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => "token-1" }));

const base = "https://merchant.test";
const path = `${base}/api/v1/merchant/complaints`;
const id = BE_COMPLAINT.id;
const requests: Request[] = [];
const ok = (data: unknown) => HttpResponse.json({ success: true, data, detail: "OK" });

beforeEach(() => {
  requests.length = 0;
  vi.stubEnv("MERCHANT_BASE_URL", base);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

afterEach(() => vi.unstubAllEnvs());

describe("listComplaints", () => {
  it("reads the portal list, sends page from 1 and size, and maps the page to rows and total", async () => {
    mswServer.use(
      http.get(path, ({ request }) => {
        requests.push(request);
        return ok({ content: [BE_COMPLAINT_ROW], totalElements: 31, totalPages: 4, number: 1, size: 10 });
      }),
    );
    const result = await listComplaints({
      page: 2,
      pageSize: 10,
      keyword: "KN",
      status: "PROCESSING",
      waitingOn: "MERCHANT",
      reporterType: "ADMIN",
      subMerchantId: BE_COMPLAINT.subMerchantId ?? undefined,
      createdFrom: "2026-11-01",
      createdTo: "2026-11-03",
    });
    expect(result).toEqual({ success: true, data: { rows: [BE_COMPLAINT_ROW], total: 31 } });
    expect(Object.fromEntries(new URL(requests[0]!.url).searchParams)).toEqual({
      page: "2",
      size: "10",
      keyword: "KN",
      status: "PROCESSING",
      waitingOn: "MERCHANT",
      reporterType: "ADMIN",
      subMerchantId: BE_COMPLAINT.subMerchantId,
      createdFrom: "2026-11-01",
      createdTo: "2026-11-03",
    });
    expect(requests[0]!.headers.get("authorization")).toBe("Bearer token-1");
  });
});

describe("complaint writes", () => {
  it("gets the detail, creates, replies and rejects on the portal paths with the contract bodies", async () => {
    mswServer.use(
      http.all(`${path}*`, async ({ request }) => {
        requests.push(request.clone());
        return ok(BE_COMPLAINT);
      }),
    );
    await getComplaint(id);
    await createComplaint({ transactionCode: "FM1", reasonCode: "FRAUD", content: "x", attachmentIds: [] });
    await replyComplaint(id, { content: "Đã gửi sao kê", attachmentIds: ["a"] });
    await rejectComplaint(id, "Giao dịch hợp lệ");
    const calls = await Promise.all(
      requests.map(async (request) => [request.method, new URL(request.url).pathname, await request.text()]),
    );
    expect(calls).toEqual([
      ["GET", `/api/v1/merchant/complaints/${id}`, ""],
      ["POST", "/api/v1/merchant/complaints", JSON.stringify({ transactionCode: "FM1", reasonCode: "FRAUD", content: "x", attachmentIds: [] })],
      ["POST", `/api/v1/merchant/complaints/${id}/replies`, JSON.stringify({ content: "Đã gửi sao kê", attachmentIds: ["a"] })],
      ["POST", `/api/v1/merchant/complaints/${id}/reject`, JSON.stringify({ reason: "Giao dịch hợp lệ" })],
    ]);
  });

  it("keeps the Vietnamese BE detail of a business error", async () => {
    mswServer.use(
      http.post(path, () =>
        HttpResponse.json({ success: false, status: "6203", detail: "Giao dịch đang có khiếu nại chưa kết thúc" }, { status: 409 }),
      ),
    );
    const result = await createComplaint({ transactionCode: "FM1", reasonCode: "OTHER", content: "x", attachmentIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatchObject({ status: 409, message: "Giao dịch đang có khiếu nại chưa kết thúc" });
  });

  it("reads the five-minute attachment link", async () => {
    mswServer.use(
      http.get(`${path}/${id}/attachments/:aid/link`, () => ok({ url: "https://s3.test/a", ttlSeconds: 300, expiresAt: "2026-11-03T10:05:00" })),
    );
    const result = await getAttachmentLink(id, "66666666-6666-4666-8666-666666666666");
    expect(result).toMatchObject({ success: true, data: { url: "https://s3.test/a", ttlSeconds: 300 } });
  });
});

describe("uploadAttachment", () => {
  it("sends the file as multipart and returns the staging id", async () => {
    let received: File | null = null;
    mswServer.use(
      http.post(`${path}/attachments`, async ({ request }) => {
        received = (await request.formData()).get("file") as File;
        return HttpResponse.json({ success: true, data: { attachmentId: "staging-1" } }, { status: 201 });
      }),
    );
    const result = await uploadAttachment(new File(["%PDF"], "a.pdf", { type: "application/pdf" }));
    expect(result).toEqual({ success: true, data: "staging-1" });
    expect(received!.name).toBe("a.pdf");
  });

  it("forwards the BE file error sentence", async () => {
    mswServer.use(
      http.post(`${path}/attachments`, () =>
        HttpResponse.json({ success: false, status: "4903", detail: "Định dạng file không hỗ trợ" }, { status: 400 }),
      ),
    );
    const result = await uploadAttachment(new File(["x"], "a.pdf"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe("Định dạng file không hỗ trợ");
  });
});

describe("exportComplaints", () => {
  it("passes the CSV bytes through with the filter and no paging", async () => {
    mswServer.use(
      http.get(`${path}/export`, ({ request }) => {
        requests.push(request);
        return new HttpResponse("﻿Mã khiếu nại\nKN1\n", {
          headers: { "Content-Type": "text/csv; charset=UTF-8", "Content-Disposition": 'attachment; filename="khieu-nai.csv"' },
        });
      }),
    );
    const result = await exportComplaints({ page: 3, pageSize: 50, status: "CLOSED" });
    expect(Object.fromEntries(new URL(requests[0]!.url).searchParams)).toEqual({ status: "CLOSED" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.contentDisposition).toBe('attachment; filename="khieu-nai.csv"');
    expect(new TextDecoder().decode(result.data.body)).toContain("KN1");
  });

  it("returns the BE error instead of a file", async () => {
    mswServer.use(http.get(`${path}/export`, () => HttpResponse.json({ success: false, detail: "Không có quyền" }, { status: 403 })));
    const result = await exportComplaints({ page: 1, pageSize: 10 });
    expect(result).toMatchObject({ success: false, error: { status: 403, message: "Không có quyền" } });
  });
});

describe("checkTransaction", () => {
  it("reads the portal check with the code as a query and returns the order", async () => {
    let received: string | null = null;
    mswServer.use(
      http.get(`${path}/transaction-check`, ({ request }) => {
        received = new URL(request.url).searchParams.get("transactionCode");
        return ok({ transactionId: "t1", transactionCode: "FM1", amount: 1000, status: "SUCCESS" });
      }),
    );
    const result = await checkTransaction("FM1");
    expect(result.success && result.data.transactionCode).toBe("FM1");
    expect(received).toBe("FM1");
  });

  it("returns the 6202 failure with the BE sentence", async () => {
    mswServer.use(
      http.get(`${path}/transaction-check`, () =>
        HttpResponse.json(
          { success: false, errorCode: "6202", detail: "Mã giao dịch không tồn tại", errors: ["Mã giao dịch không tồn tại"] },
          { status: 404 },
        ),
      ),
    );
    const result = await checkTransaction("FM-X");
    expect(result.success).toBe(false);
  });
});
