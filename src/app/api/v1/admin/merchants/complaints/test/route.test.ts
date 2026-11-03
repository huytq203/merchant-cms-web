import { beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({
  listComplaints: vi.fn(),
  createComplaint: vi.fn(),
  exportComplaints: vi.fn(),
  uploadAttachment: vi.fn(),
  getComplaint: vi.fn(),
  replyComplaint: vi.fn(),
  rejectComplaint: vi.fn(),
  getAttachmentLink: vi.fn(),
}));
const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/complaints/complaint.service", () => service);

import { GET as list, POST as create } from "../route";
import { GET as exportCsv } from "../export/route";
import { POST as upload } from "../attachments/route";
import { GET as detail } from "../[id]/route";
import { POST as reply } from "../[id]/replies/route";
import { POST as reject } from "../[id]/reject/route";
import { GET as link } from "../[id]/attachments/[attachmentId]/link/route";

const ID = "11111111-1111-4111-8111-111111111111";
const AID = "66666666-6666-4666-8666-666666666666";
const url = (path = "") => `http://localhost/api/v1/admin/merchants/complaints${path}`;
const json = (path: string, body: unknown) =>
  new Request(url(path), { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const session = (permissions: string[]) => ({ merchantIds: [], subMerchantIds: [], permissions });
const params = <T,>(value: T) => ({ params: Promise.resolve(value) });
const done = { success: true, data: { id: ID } };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_DISPUTE", "CREATE_DISPUTE", "REPLY_DISPUTE"]));
  service.listComplaints.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
  for (const fn of [service.createComplaint, service.getComplaint, service.replyComplaint, service.rejectComplaint]) {
    fn.mockResolvedValue(done);
  }
});

describe("list route", () => {
  it("answers 401 without a session and 403 without VIEW_DISPUTE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await list(new Request(url()))).status).toBe(401);
    getServerSession.mockResolvedValue(session(["CREATE_DISPUTE"]));
    expect((await list(new Request(url()))).status).toBe(403);
    expect(service.listComplaints).not.toHaveBeenCalled();
  });

  it("lets a Sub-only user (no Master) read and passes only the BE filters", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_DISPUTE"]));
    const response = await list(new Request(url("?page=2&pageSize=20&status=CLOSED&waitingOn=ADMIN&reporterType=USER&createdFrom=2026-11-01")));
    expect(response.status).toBe(200);
    expect(service.listComplaints).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      status: "CLOSED",
      waitingOn: "ADMIN",
      reporterType: "USER",
      createdFrom: "2026-11-01",
    });
  });

  it("rejects an oversized page, an old status, a bad sub-merchant id and a reversed range", async () => {
    for (const query of ["?pageSize=101", "?status=resolved", "?subMerchantId=SM01", "?createdFrom=2026-11-05&createdTo=2026-11-01"]) {
      expect((await list(new Request(url(query)))).status).toBe(400);
    }
    expect(service.listComplaints).not.toHaveBeenCalled();
  });

  it("forwards the Vietnamese BE message and turns a BE 401 into 403", async () => {
    service.listComplaints.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "x" } });
    expect((await list(new Request(url()))).status).toBe(403);
  });
});

describe("create route", () => {
  const body = { transactionCode: " FM1 ", reasonCode: "FRAUD", content: "Khách báo gian lận" };

  it("needs CREATE_DISPUTE", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_DISPUTE", "REPLY_DISPUTE"]));
    expect((await create(json("", body))).status).toBe(403);
    expect(service.createComplaint).not.toHaveBeenCalled();
  });

  it("creates with a trimmed code and an empty attachment list, answering 201", async () => {
    const response = await create(json("", body));
    expect(response.status).toBe(201);
    expect(service.createComplaint).toHaveBeenCalledWith({ ...body, transactionCode: "FM1", attachmentIds: [] });
  });

  it("refuses an unknown reason, an empty or too long content and more than ten files", async () => {
    const ids = Array.from({ length: 11 }, () => ID);
    for (const bad of [
      { ...body, reasonCode: "wrong_charge" },
      { ...body, content: "   " },
      { ...body, content: "x".repeat(2001) },
      { ...body, attachmentIds: ids },
    ]) {
      expect((await create(json("", bad))).status).toBe(400);
    }
    expect(service.createComplaint).not.toHaveBeenCalled();
  });

  it("forwards a BE business error with its Vietnamese sentence", async () => {
    service.createComplaint.mockResolvedValue({
      success: false,
      error: { status: 404, code: "HTTP_404", message: "Mã giao dịch không tồn tại" },
    });
    const response = await create(json("", body));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Mã giao dịch không tồn tại" });
  });
});

describe("export route", () => {
  it("streams the CSV with its file name, VIEW_DISPUTE only", async () => {
    service.exportComplaints.mockResolvedValue({
      success: true,
      data: { body: new TextEncoder().encode("﻿a\n").buffer, contentType: "text/csv; charset=UTF-8", contentDisposition: 'attachment; filename="kn.csv"' },
    });
    const response = await exportCsv(new Request(url("/export?status=WAITING&page=3")));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="kn.csv"');
    expect(service.exportComplaints).toHaveBeenCalledWith({ page: 3, pageSize: 10, status: "WAITING" });
    getServerSession.mockResolvedValue(session(["CREATE_DISPUTE"]));
    expect((await exportCsv(new Request(url("/export")))).status).toBe(403);
  });
});

describe("attachment upload route", () => {
  const form = () => {
    const data = new FormData();
    data.set("file", new File(["%PDF"], "a.pdf", { type: "application/pdf" }));
    return new Request(url("/attachments"), { method: "POST", body: data });
  };

  it("accepts CREATE_DISPUTE or REPLY_DISPUTE and refuses VIEW_DISPUTE alone", async () => {
    service.uploadAttachment.mockResolvedValue({ success: true, data: "staging-1" });
    getServerSession.mockResolvedValue(session(["REPLY_DISPUTE"]));
    const response = await upload(form());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ attachmentId: "staging-1" });
    getServerSession.mockResolvedValue(session(["VIEW_DISPUTE"]));
    expect((await upload(form())).status).toBe(403);
  });

  it("refuses a request without a file", async () => {
    const response = await upload(new Request(url("/attachments"), { method: "POST", body: new FormData() }));
    expect(response.status).toBe(400);
    expect(service.uploadAttachment).not.toHaveBeenCalled();
  });
});

describe("routes on one complaint", () => {
  it("answers 404 for an id that is not a UUID, before calling the BE", async () => {
    expect((await detail(new Request(url("/x")), params({ id: "..%2f" }))).status).toBe(404);
    expect((await link(new Request(url()), params({ id: ID, attachmentId: "x" }))).status).toBe(404);
    expect(service.getComplaint).not.toHaveBeenCalled();
    expect(service.getAttachmentLink).not.toHaveBeenCalled();
  });

  it("reads the detail and the attachment link with VIEW_DISPUTE", async () => {
    service.getAttachmentLink.mockResolvedValue({ success: true, data: { url: "https://s3.test/a" } });
    expect((await detail(new Request(url()), params({ id: ID }))).status).toBe(200);
    const response = await link(new Request(url()), params({ id: ID, attachmentId: AID }));
    expect(await response.json()).toEqual({ url: "https://s3.test/a" });
    expect(service.getAttachmentLink).toHaveBeenCalledWith(ID, AID);
  });

  it("replies and rejects only with REPLY_DISPUTE", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_DISPUTE", "CREATE_DISPUTE"]));
    expect((await reply(json("", { content: "x" }), params({ id: ID }))).status).toBe(403);
    expect((await reject(json("", { reason: "x" }), params({ id: ID }))).status).toBe(403);
    expect(service.replyComplaint).not.toHaveBeenCalled();
    expect(service.rejectComplaint).not.toHaveBeenCalled();
  });

  it("checks the reply content (1–1000) and the mandatory reject reason (≤ 2000)", async () => {
    expect((await reply(json("", { content: "" }), params({ id: ID }))).status).toBe(400);
    expect((await reply(json("", { content: "x".repeat(1001) }), params({ id: ID }))).status).toBe(400);
    expect((await reject(json("", { reason: "  " }), params({ id: ID }))).status).toBe(400);
    expect((await reject(json("", { reason: "x".repeat(2001) }), params({ id: ID }))).status).toBe(400);
    expect((await reply(json("", { content: " Đã gửi ", attachmentIds: [AID] }), params({ id: ID }))).status).toBe(200);
    expect(service.replyComplaint).toHaveBeenCalledWith(ID, { content: "Đã gửi", attachmentIds: [AID] });
    expect((await reject(json("", { reason: "Hợp lệ" }), params({ id: ID }))).status).toBe(200);
    expect(service.rejectComplaint).toHaveBeenCalledWith(ID, "Hợp lệ");
  });

  it("forwards a state error (6205) with its sentence", async () => {
    service.rejectComplaint.mockResolvedValue({
      success: false,
      error: { status: 409, code: "HTTP_409", message: "Khiếu nại đang ở trạng thái không cho phép thao tác này" },
    });
    const response = await reject(json("", { reason: "x" }), params({ id: ID }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Khiếu nại đang ở trạng thái không cho phép thao tác này" });
  });
});
