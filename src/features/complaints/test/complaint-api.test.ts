// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { ApiError } from "@/lib/http/api-client";
import { checkComplaintTransaction, describeComplaintError, exportQuery, fileNameFrom, uploadEvidence } from "../complaint-api";

describe("fileNameFrom", () => {
  it("reads the plain and the UTF-8 file name, else falls back", () => {
    expect(fileNameFrom('attachment; filename="khieu-nai-20261103.csv"', "x.csv")).toBe("khieu-nai-20261103.csv");
    expect(fileNameFrom("attachment; filename*=UTF-8''khi%E1%BA%BFu-n%E1%BA%A1i.csv", "x.csv")).toBe("khiếu-nại.csv");
    expect(fileNameFrom(null, "x.csv")).toBe("x.csv");
  });
});

describe("exportQuery", () => {
  it("keeps the filter and drops the paging", () => {
    expect(Object.fromEntries(exportQuery({ page: 4, pageSize: 50, keyword: "KN", reporterType: "USER" }))).toEqual({
      keyword: "KN",
      reporterType: "USER",
    });
  });
});

describe("uploadEvidence", () => {
  it("uploads one file per call, in order, and stops at the first refused file", async () => {
    // The body is not parsed here: undici cannot re-read a jsdom File. Calls are counted instead.
    let calls = 0;
    let refuseFrom = Infinity;
    mswServer.use(
      http.post("/api/v1/admin/merchants/complaints/attachments", () => {
        calls += 1;
        if (calls >= refuseFrom) return HttpResponse.json({ message: "Định dạng file không hỗ trợ" }, { status: 400 });
        return HttpResponse.json({ attachmentId: `id-${calls}` }, { status: 201 });
      }),
    );
    expect(await uploadEvidence([new File(["a"], "a.pdf"), new File(["b"], "b.png")])).toEqual(["id-1", "id-2"]);
    refuseFrom = 3;
    const failure = await uploadEvidence([new File(["x"], "bad.png"), new File(["c"], "c.png")]).catch((error: unknown) => error);
    expect(describeComplaintError(failure)).toBe("Định dạng file không hỗ trợ");
    expect(calls).toBe(3);
  });

  it("has a fallback message for unknown failures", () => {
    expect(describeComplaintError(new Error("boom"))).toBe("Không thực hiện được, vui lòng thử lại");
    expect(describeComplaintError(new ApiError(400, "Dung lượng file vượt quá 10MB"))).toBe("Dung lượng file vượt quá 10MB");
  });
});

describe("checkComplaintTransaction", () => {
  it("sends the trimmed code and returns the order of this merchant", async () => {
    let received: string | null = null;
    mswServer.use(
      http.get("/api/v1/admin/merchants/complaints/transaction-check", ({ request }) => {
        received = new URL(request.url).searchParams.get("transactionCode");
        return HttpResponse.json({ transactionId: "t1", transactionCode: "FM1", amount: 1000, status: "SUCCESS" });
      }),
    );
    expect((await checkComplaintTransaction("  FM1 ")).transactionCode).toBe("FM1");
    expect(received).toBe("FM1");
  });

  it("rejects with the BE sentence when the code is not a transaction of this merchant", async () => {
    mswServer.use(
      http.get("/api/v1/admin/merchants/complaints/transaction-check", () =>
        HttpResponse.json({ message: "Mã giao dịch không tồn tại" }, { status: 404 }),
      ),
    );
    const failure = await checkComplaintTransaction("FM-X").catch((error: unknown) => error);
    expect(describeComplaintError(failure)).toBe("Mã giao dịch không tồn tại");
  });
});
