// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock("@/lib/http/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/http/api-client")>("@/lib/http/api-client");
  return { ...actual, apiClient: { get, post } };
});

import {
  DISBURSEMENTS_ENDPOINT,
  disbursementQueries,
  disbursementRequests,
  downloadDisbursementsCsv,
} from "../disbursement-queries";
import { SUB_ID, viewFixture } from "./fixtures";

beforeEach(() => {
  post.mockReset();
  get.mockReset();
});

describe("disbursementRequests", () => {
  it("submitSendsOtpAndNameMismatchFlag", async () => {
    post.mockResolvedValue(viewFixture);
    await disbursementRequests.create({
      subId: SUB_ID,
      merchantRequestCode: "P2611191200000001",
      amount: 1_000_000,
      bankCode: "VCB",
      accountNumber: "0123456789",
      accountName: "Nguyen Van A",
      description: "Chi hộ",
      nameMismatchAccepted: true,
      sensitiveOtp: { otpSessionId: "session-1", otp: "123456" },
    });
    expect(post).toHaveBeenCalledTimes(1);
    const [path, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe(DISBURSEMENTS_ENDPOINT);
    expect(body.sensitiveOtp).toEqual({ otpSessionId: "session-1", otp: "123456" });
    expect(body.nameMismatchAccepted).toBe(true);
    expect(body.merchantRequestCode).toBe("P2611191200000001");
  });

  it("asks the OTP for the same Sub, code, amount and receiver the order will carry", async () => {
    post.mockResolvedValue({ otpSessionId: "s", maskedRecipient: "a***@x.vn", expiresInSeconds: 300, canResendAfterSeconds: 60 });
    await disbursementRequests.otpChallenge({
      subId: SUB_ID, merchantRequestCode: "P1", amount: 5, bankCode: "VCB", accountNumber: "0123",
    });
    expect(post).toHaveBeenCalledWith(`${DISBURSEMENTS_ENDPOINT}/otp-challenge`, expect.objectContaining({ merchantRequestCode: "P1", amount: 5 }), expect.anything());
  });

  it("uploads the batch file as multipart with the Sub id", async () => {
    post.mockResolvedValue({});
    const file = new File(["a"], "lo.csv", { type: "text/csv" });
    await disbursementRequests.validateBatch(SUB_ID, file);
    const [path, body] = post.mock.calls[0] as [string, FormData];
    expect(path).toBe(`${DISBURSEMENTS_ENDPOINT}/batches/validate`);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("subId")).toBe(SUB_ID);
    expect((body.get("file") as File).name).toBe("lo.csv");
  });

  it("sends the batch submit with the version the user reviewed and the OTP", async () => {
    post.mockResolvedValue({});
    await disbursementRequests.submitBatch("55555555-5555-4555-8555-555555555555", {
      expectedVersion: 2, sensitiveOtp: { otpSessionId: "s", otp: "123456" },
    });
    expect(post).toHaveBeenCalledWith(
      `${DISBURSEMENTS_ENDPOINT}/batches/55555555-5555-4555-8555-555555555555/submit`,
      { expectedVersion: 2, sensitiveOtp: { otpSessionId: "s", otp: "123456" } },
      expect.anything(),
    );
  });
});

describe("disbursementQueries", () => {
  it("reads the top-up list per Sub with the page and status filter", async () => {
    get.mockResolvedValue({ rows: [], total: 0 });
    const options = disbursementQueries.topups(SUB_ID, { page: 2, pageSize: 10, status: "APPROVED" });
    await (options.queryFn as () => Promise<unknown>)();
    expect(get).toHaveBeenCalledWith(`${DISBURSEMENTS_ENDPOINT}/subs/${SUB_ID}/topups`, { query: { page: 2, pageSize: 10, status: "APPROVED" } });
  });

  it("does not read a batch before there is an id", () => {
    expect(disbursementQueries.batch("").enabled).toBe(false);
  });
});

describe("read queries (Task 5.15)", () => {
  const run = (options: { queryFn?: unknown }) => (options.queryFn as () => Promise<unknown>)();

  it("searches orders with POST (search codes stay out of the URL) and 0-based paging", async () => {
    post.mockResolvedValue({ items: [], total: 0, page: 1, size: 20 });
    await run(disbursementQueries.orders({ page: 2, pageSize: 20, code: "P1", status: "FAILED", subMerchantIds: [SUB_ID] }));
    expect(post).toHaveBeenCalledWith(
      `${DISBURSEMENTS_ENDPOINT}/search`,
      { subIds: [SUB_ID], filter: { code: "P1", statuses: ["FAILED"] }, page: 1, size: 20 },
      expect.objectContaining({ toast: false }),
    );
  });

  it("reads one order and does not read before there is an id", async () => {
    get.mockResolvedValue({});
    await run(disbursementQueries.order("66666666-6666-4666-8666-666666666666"));
    expect(get).toHaveBeenCalledWith(`${DISBURSEMENTS_ENDPOINT}/orders/66666666-6666-4666-8666-666666666666`);
    expect(disbursementQueries.order("").enabled).toBe(false);
  });

  it("lists batches with Sub/status filter and 1-based paging", async () => {
    get.mockResolvedValue({ items: [], total: 0, page: 0, size: 10 });
    await run(disbursementQueries.batches({ page: 3, pageSize: 10, subId: SUB_ID, status: "SUBMITTING" }));
    expect(get).toHaveBeenCalledWith(`${DISBURSEMENTS_ENDPOINT}/batches`, { query: { page: 3, pageSize: 10, subId: SUB_ID, status: "SUBMITTING" } });
  });
});

describe("downloadDisbursementsCsv", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("exportSendsSameFilters: POSTs the list filter without paging and saves the file BE names", async () => {
    fetchMock.mockResolvedValue(new Response("a", { status: 200, headers: { "content-disposition": 'attachment; filename="chi-ho.csv"' } }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await downloadDisbursementsCsv({ page: 5, pageSize: 50, code: "P1", status: "SUCCEEDED" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`/api${DISBURSEMENTS_ENDPOINT}/export`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ filter: { code: "P1", statuses: ["SUCCEEDED"] } });
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it("saves the file under the name BE gave", async () => {
    fetchMock.mockResolvedValue(new Response("a", { status: 200, headers: { "content-disposition": 'attachment; filename="chi-ho-18.csv"' } }));
    let saved = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { saved = this.download; });
    await downloadDisbursementsCsv({ page: 1, pageSize: 10 });
    expect(saved).toBe("chi-ho-18.csv");
    click.mockRestore();
  });

  it("sends an expired session to the login page like apiClient does, after one failed refresh", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { origin: "http://localhost", assign });
    fetchMock.mockImplementation(async () => new Response("", { status: 401 }));
    await expect(downloadDisbursementsCsv({ page: 1, pageSize: 10 })).rejects.toThrow();
    expect(assign).toHaveBeenCalledWith("http://localhost/api/v1/admin/auth/session-expired");
  });

  it("retries once when the refresh works", async () => {
    let exports = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/auth/refresh")) return new Response("", { status: 200 });
      exports += 1;
      return exports === 1 ? new Response("", { status: 401 }) : new Response("a", { status: 200 });
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await downloadDisbursementsCsv({ page: 1, pageSize: 10 });
    expect(exports).toBe(2);
  });

  it("surfaces the Vietnamese message of a refused export (e.g. over 50.000 rows)", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Vượt quá 50.000 dòng, hãy thu hẹp bộ lọc" }), { status: 400 }));
    await expect(downloadDisbursementsCsv({ page: 1, pageSize: 10 })).rejects.toThrow("Vượt quá 50.000 dòng, hãy thu hẹp bộ lọc");
  });
});
